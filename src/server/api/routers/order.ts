import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma, FulfilmentStatus, Role } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  adminProcedure,
  caretakerProcedure,
  supplierProcedure,
  supplierOwnsOrder,
} from "../rbac";

// Utility to get today's date range
const todayRange = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ----- inputs -----
const idParam = z.object({ orderId: z.number().int().positive() });

const changeStatusInput = z.object({
  orderId: z.number().int().positive(),
  status: z.nativeEnum(FulfilmentStatus),
});

const requestQuoteInput = z.object({
  orderId: z.number().int().positive(),
  supplierId: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  notes: z.string().optional(),
});

const acceptQuoteInput = z.object({
  quoteId: z.string().min(1),
});

const refundInput = z.object({
  orderId: z.number().int().positive(),
  amountCents: z.number().int().positive(), // caretakers ≤ 20000
  reason: z.string().min(3),
});

const payoutInput = z.object({
  orderId: z.number().int().positive(),
  supplierId: z.string().min(1),
  amountCents: z.number().int().positive(),
});

const messageInput = z.object({
  orderId: z.number().int().positive(),
  to: z.enum(["CUSTOMER", "SUPPLIER"]),
  text: z.string().min(1),
});

const exportCsvInput = z.object({
  from: z.string().datetime().optional(), // ISO
  to: z.string().datetime().optional(), // ISO
});

// ----- helpers -----
const ALLOWED_FROM: Record<FulfilmentStatus, FulfilmentStatus[]> = {
  NEW: [FulfilmentStatus.SOURCING_SUPPLIER, FulfilmentStatus.CANCELED],
  SOURCING_SUPPLIER: [
    FulfilmentStatus.SUPPLIER_CONFIRMED,
    FulfilmentStatus.CANCELED,
  ],
  SUPPLIER_CONFIRMED: [FulfilmentStatus.IN_PROGRESS, FulfilmentStatus.CANCELED],
  IN_PROGRESS: [FulfilmentStatus.READY_FOR_DELIVERY, FulfilmentStatus.CANCELED],
  READY_FOR_DELIVERY: [FulfilmentStatus.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [FulfilmentStatus.DELIVERED],
  DELIVERED: [FulfilmentStatus.CLOSED],
  CLOSED: [],
  CANCELED: [],
};

function canTransition(from: FulfilmentStatus, to: FulfilmentStatus) {
  return ALLOWED_FROM[from]?.includes(to) ?? false;
}

export const orderRouter = createTRPCRouter({
  // Caretaker: list all orders with filters + pagination
  list: caretakerProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          status: z.nativeEnum(FulfilmentStatus).optional(),
          page: z.number().int().positive().default(1),
          pageSize: z.number().int().positive().max(100).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const q = input?.q?.trim();
      const where: Prisma.OrderWhereInput = {
        ...(input?.status ? { status: input.status } : {}),
        ...(q && q.length > 0
          ? {
              OR: [
                { code: { contains: q, mode: "insensitive" } },
                { customerName: { contains: q, mode: "insensitive" } },
                { customerPhone: { contains: q, mode: "insensitive" } },
                { suburb: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const [items, total] = await Promise.all([
        ctx.db.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            code: true,
            status: true,
            price: true,
            deliveryCents: true,
            currency: true,
            customerName: true,
            customerPhone: true,
            suburb: true,
            city: true,
            createdAt: true,
          },
          skip,
          take,
        }),
        ctx.db.order.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),
  // Create a manual order (admin/caretaker)
  createManual: caretakerProcedure
    .input(
      z.object({
        customerName: z.string().min(1),
        customerPhone: z.string().min(5),
        customerEmail: z.string().email().optional(),
        addressLine1: z.string().optional(),
        suburb: z.string().optional(),
        city: z.string().optional(),
        note: z.string().optional(),
        priceCents: z.number().int().nonnegative(),
        deliveryCents: z.number().int().nonnegative().default(0),
        paymentMethod: z.string().min(1), // e.g. CASH | CARD | EFT | OTHER
        paymentRef: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.create({
        data: {
          name: "Manual Order",
          description: input.note ?? "Manual order",
          link: "manual",
          api: "manual",
          createdBy: { connect: { id: ctx.session.user.id } },
          price: input.priceCents,
          deliveryCents: input.deliveryCents,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail ?? null,
          addressLine1: input.addressLine1 ?? null,
          suburb: input.suburb ?? null,
          city: input.city ?? null,
          caretaker: { connect: { id: ctx.session.user.id } },
          status: FulfilmentStatus.NEW,
        },
        select: { id: true },
      });

      const total = input.priceCents + (input.deliveryCents ?? 0);
      await ctx.db.payment.create({
        data: {
          orderId: order.id,
          amountCents: total,
          status: "PAID",
          provider: input.paymentMethod,
          providerRef: input.paymentRef ?? undefined,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          orderId: order.id,
          actorId: ctx.session.user.id,
          action: "MANUAL_CREATE",
          payload: {
            paymentMethod: input.paymentMethod,
            amountCents: total,
          },
        },
      });

      return { id: order.id };
    }),
  // Summary metrics for admin dashboard
  dashboardSummary: caretakerProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);

    const startYesterday = new Date(startToday);
    startYesterday.setDate(startYesterday.getDate() - 1);
    const endYesterday = new Date(startToday);
    endYesterday.setMilliseconds(-1);

    const [dailyOrders, yesterdayOrders, openOrders, closedOrders, totalUsers] =
      await Promise.all([
        ctx.db.order.count({ where: { createdAt: { gte: startToday, lte: endToday } } }),
        ctx.db.order.count({ where: { createdAt: { gte: startYesterday, lte: endYesterday } } }),
        ctx.db.order.count({ where: { status: { notIn: [FulfilmentStatus.CLOSED, FulfilmentStatus.CANCELED] } } }),
        ctx.db.order.count({ where: { status: FulfilmentStatus.CLOSED } }),
        ctx.db.user.count(),
      ]);

    return { dailyOrders, yesterdayOrders, openOrders, closedOrders, totalUsers };
  }),
  // Public lookup (e.g., status page)
  getByCode: publicProcedure
    .input(z.object({ code: z.string().min(6) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.order.findFirstOrThrow({
        where: { code: input.code },
        select: {
          id: true,
          code: true,
          status: true,
          createdAt: true,
          customerName: true,
          suburb: true,
          city: true,
          supplierId: true,
        },
      });
    }),

  // Admin/Caretaker: get by ID (detailed)
  getById: caretakerProcedure.input(idParam).query(async ({ ctx, input }) => {
    return ctx.db.order.findUniqueOrThrow({
      where: { id: input.orderId },
      select: {
        id: true,
        code: true,
        status: true,
        createdAt: true,
        customerName: true,
        suburb: true,
        city: true,
        supplierId: true,
        auditLogs: true,
        payouts: true,
        price: true,
        deliveryCents: true,
        currency: true,
        supplier: { select: { id: true, name: true, phone: true } },
        customerPhone: true,
        customerEmail: true,
        addressLine1: true,
      },
    });
  }),

  // Admin/Caretaker: change status
  changeStatus: caretakerProcedure
    .input(changeStatusInput)
    .mutation(async ({ ctx, input }) => {
      const ord = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        select: { status: true },
      });
      if (!ord) throw new TRPCError({ code: "NOT_FOUND" });

      if (!canTransition(ord.status, input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid transition ${ord.status} -> ${input.status}`,
        });
      }

      const updated = await ctx.db.order.update({
        where: { id: input.orderId },
        data: { status: input.status },
      });

      await ctx.db.auditLog.create({
        data: {
          orderId: input.orderId,
          actorId: ctx.session.user.id,
          action: "STATUS_CHANGE",
          payload: { from: ord.status, to: input.status },
        },
      });

      return updated;
    }),

  // Supplier: update readiness (limited status set)
  supplierUpdateStatus: supplierOwnsOrder
    .input(changeStatusInput)
    .mutation(async ({ ctx, input }) => {
      const allowedSupplierStatuses: FulfilmentStatus[] = [
        FulfilmentStatus.IN_PROGRESS,
        FulfilmentStatus.READY_FOR_DELIVERY,
        FulfilmentStatus.OUT_FOR_DELIVERY,
        FulfilmentStatus.DELIVERED,
      ];

      if (!allowedSupplierStatuses.includes(input.status)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Status not permitted for supplier",
        });
      }

      const ord = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        select: { status: true },
      });
      if (!ord) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canTransition(ord.status, input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid transition ${ord.status} -> ${input.status}`,
        });
      }

      const updated = await ctx.db.order.update({
        where: { id: input.orderId },
        data: { status: input.status },
      });

      await ctx.db.auditLog.create({
        data: {
          orderId: input.orderId,
          actorId: ctx.session.user.id,
          action: "SUPPLIER_STATUS",
          payload: { from: ord.status, to: input.status },
        },
      });

      return updated;
    }),

  // Caretaker: request quote from supplier
  requestQuote: caretakerProcedure
    .input(requestQuoteInput)
    .mutation(async ({ ctx, input }) => {
      const q = await ctx.db.supplierQuote.create({
        data: {
          orderId: input.orderId,
          supplierId: input.supplierId,
          amountCents: input.amountCents,
          notes: input.notes,
        },
      });
      await ctx.db.auditLog.create({
        data: {
          orderId: input.orderId,
          actorId: ctx.session.user.id,
          action: "REQUEST_QUOTE",
          payload: {
            supplierId: input.supplierId,
            amountCents: input.amountCents,
          },
        },
      });
      return q;
    }),

  // Caretaker: accept quote (assign supplier)
  acceptQuote: caretakerProcedure
    .input(acceptQuoteInput)
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.db.supplierQuote.findUnique({
        where: { id: input.quoteId },
        select: { orderId: true, supplierId: true, amountCents: true },
      });
      if (!quote) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.order.update({
        where: { id: quote.orderId },
        data: {
          supplierId: quote.supplierId,
          status: FulfilmentStatus.SUPPLIER_CONFIRMED,
        },
      });

      await ctx.db.auditLog.create({
        data: {
          orderId: quote.orderId,
          actorId: ctx.session.user.id,
          action: "ACCEPT_QUOTE",
          payload: {
            quoteId: input.quoteId,
            supplierId: quote.supplierId,
            amountCents: quote.amountCents,
          },
        },
      });

      return updated;
    }),

  // Caretaker/Admin: partial refund (≤ R200 for caretakers)
  issueRefund: protectedProcedure
    .input(refundInput)
    .mutation(async ({ ctx, input }) => {
      const isCaretaker = ctx.session.user.role === Role.CARETAKER;
      if (isCaretaker && input.amountCents > 20000) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Caretaker refund limit is R200",
        });
      }

      // Record audit — integrate gateway later
      await ctx.db.auditLog.create({
        data: {
          orderId: input.orderId,
          actorId: ctx.session.user.id,
          action: "REFUND",
          payload: { amountCents: input.amountCents, reason: input.reason },
        },
      });

      return { ok: true as const };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.order.findMany();
  }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const order = await ctx.db.order.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });

    return order ?? null;
  }),

  // Caretaker/Admin: trigger supplier payout
  triggerPayout: protectedProcedure
    .input(payoutInput)
    .mutation(async ({ ctx, input }) => {
      const payout = await ctx.db.supplierPayout.create({
        data: {
          orderId: input.orderId,
          supplierId: input.supplierId,
          amountCents: input.amountCents,
          status: "PENDING",
        },
      });
      await ctx.db.auditLog.create({
        data: {
          orderId: input.orderId,
          actorId: ctx.session.user.id,
          action: "TRIGGER_PAYOUT",
          payload: { payoutId: payout.id, amountCents: input.amountCents },
        },
      });
      return payout;
    }),

  // Caretaker/Admin: send messages (logs for now)
  sendMessage: protectedProcedure
    .input(messageInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.auditLog.create({
        data: {
          orderId: input.orderId,
          actorId: ctx.session.user.id,
          action: "MESSAGE",
          payload: { to: input.to, text: input.text },
        },
      });
      return { ok: true as const };
    }),
  /*
  // Caretaker: export CSV of own day
  exportCsv: caretakerProcedure
    .input(exportCsvInput.optional())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const from = input?.from
        ? new Date(input.from)
        : new Date(new Date().toDateString()); // midnight today
      const to = input?.to ? new Date(input.to) : new Date(); // now

      const rows = await ctx.db.order.findMany({
        where: {
          caretakerId: userId,
          createdAt: { gte: from, lte: to },
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          code: true,
          status: true,
          price: true,
          deliveryCents: true,
          currency: true,
          customerName: true,
          customerPhone: true,
          suburb: true,
          city: true,
          createdAt: true,
        },
      });

      // Minimal CSV (no external deps)
      const header = [
        "id",
        "code",
        "status",
        "priceCents",
        "deliveryCents",
        "currency",
        "customerName",
        "customerPhone",
        "suburb",
        "city",
        "createdAt",
      ];
      const toSafeString = (v: unknown): string => {
        if (v == null) return "";
        if (v instanceof Date) return v.toISOString();
        const t = typeof v;
        if (t === "string" || t === "number" || t === "boolean")
          return String(v);
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      };

      const escape = (v: unknown) =>
        `"${String(toSafeString(v) ?? "").replaceAll('"', '""')}"`;
      const csv = [
        header.join(","),
        ...rows.map((r) =>
          [
            r.id,
            r.code,
            r.status,
            r.price,
            r.deliveryCents,
            r.currency,
            r.customerName,
            r.customerPhone,
            r.suburb,
            r.city,
            r.createdAt.toISOString(),
          ]
            .map(escape)
            .join(","),
        ),
      ].join("\n");

      return { csv }; // client can download as text/csv
    }),*/

  // Caretaker: list today's orders
  listToday: caretakerProcedure.query(async ({ ctx }) => {
    const { start, end } = todayRange();
    const rows = await ctx.db.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        code: true,
        status: true,
        price: true,
        deliveryCents: true,
        currency: true,
        customerName: true,
        customerPhone: true,
        suburb: true,
        city: true,
        createdAt: true,
      },
    });
    // group by status for the Kanban columns
    const map = new Map<FulfilmentStatus, typeof rows>();
    rows.forEach((r) => {
      const arr = map.get(r.status) ?? [];
      arr.push(r);
      map.set(r.status, arr);
    });
    return Object.fromEntries(map);
  }),

  reportDaily: caretakerProcedure.query(async ({ ctx }) => {
    // day range
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    // Select a typed shape so we don't fall into `any`
    const orders = await ctx.db.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: {
        price: true, // number (cents)
        deliveryCents: true, // number (cents)
        status: true,
        payouts: {
          // typed array
          select: { amountCents: true, status: true },
        },
        auditLogs: {
          // refunds recorded as payload JSON
          where: { action: "REFUND" },
          select: { payload: true }, // Prisma.JsonValue
        },
      },
    });

    // Revenue = price + delivery (ignore null/undefined safely)
    const revenue = orders.reduce((sum, o) => {
      const base = typeof o.price === "number" ? o.price : 0;
      const del = typeof o.deliveryCents === "number" ? o.deliveryCents : 0;
      return sum + base + del;
    }, 0);

    // Supplier payouts = sum of non-failed payouts.amountCents
    const supplierPayouts = orders.reduce((sum, o) => {
      const paid = o.payouts
        .filter((p) => p.status !== "FAILED")
        .reduce(
          (s, p) => s + (typeof p.amountCents === "number" ? p.amountCents : 0),
          0,
        );
      return sum + paid;
    }, 0);

    // Refunds = sum of payload.amountCents from refund logs
    const refunds = orders.reduce((sum, o) => {
      const centsFromLogs = o.auditLogs.reduce((s, log) => {
        const payload = log.payload; // already Prisma.JsonValue (or JsonValue | null)
        let val = 0;
        if (
          payload &&
          typeof payload === "object" &&
          "amountCents" in payload
        ) {
          const v = (payload as Record<string, unknown>).amountCents;
          if (typeof v === "number") val = v;
        }
        return s + val;
      }, 0);
      return sum + centsFromLogs;
    }, 0);

    const margin = revenue - supplierPayouts - refunds;

    return { revenue, supplierPayouts, refunds, margin };
  }),
});
