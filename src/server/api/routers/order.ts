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
  
  getAll:publicProcedure.query(async ({ ctx }) => {
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
});
