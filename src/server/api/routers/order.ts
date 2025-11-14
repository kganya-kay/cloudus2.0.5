import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  Prisma,
  FulfilmentStatus,
  Role,
  PaymentStatus,
  DeliveryStatus,
} from "@prisma/client";
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
import {
  notifyDriverAssignment,
  notifyOrderCreated,
  notifyOrderStatusChanged,
  notifyPaymentUpdate,
  notifyPayoutUpdate,
} from "../notification-service";

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

const updateOrderInput = z.object({
  orderId: z.number().int().positive(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  image: z.string().url().optional(),
  link: z.string().optional(),
  api: z.string().optional(),
  links: z.array(z.string()).optional(),
  deliveryCents: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  suburb: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  estimatedKg: z.number().positive().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  caretakerId: z.string().nullable().optional(),
  driverId: z.string().nullable().optional(),
  deliveryStatus: z.nativeEnum(DeliveryStatus).optional(),
  pickupWindowStart: z.string().nullable().optional(),
  pickupWindowEnd: z.string().nullable().optional(),
  dropoffWindowStart: z.string().nullable().optional(),
  dropoffWindowEnd: z.string().nullable().optional(),
  deliveryNotes: z.string().nullable().optional(),
  deliveryTrackingCode: z.string().nullable().optional(),
  proofPhotoUrl: z.string().url().nullable().optional(),
});

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

const addPaymentInput = z.object({
  orderId: z.number().int().positive(),
  amountCents: z.number().int().positive(),
  provider: z.string().min(1), // e.g. CASH | CARD | EFT | STRIPE | OZOW
  providerRef: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  status: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.PENDING),
});

const setPaymentStatusInput = z.object({
  paymentId: z.string().min(1),
  status: z.nativeEnum(PaymentStatus),
  providerRef: z.string().optional(),
  receiptUrl: z.string().url().optional(),
});

const setPayoutStatusInput = z.object({
  payoutId: z.string().min(1),
  status: z.enum(["RELEASED", "FAILED"]),
});

const messageInput = z.object({
  orderId: z.number().int().positive(),
  to: z.enum(["CUSTOMER", "SUPPLIER"]),
  text: z.string().min(1),
});

const createLaundryInput = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(5),
  customerEmail: z.string().email().optional(),
  addressLine1: z.string().min(3),
  suburb: z.string().min(2),
  city: z.string().min(2),
  serviceType: z.string().min(2).optional(),
  instructions: z.string().optional(),
  estimatedKg: z.number().min(1).max(200),
});

const LAUNDRY_PRICE_PER_KG_CENTS = 2500;
const LAUNDRY_DELIVERY_CENTS = 3000;

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

function deriveDeliveryStatus(
  status: FulfilmentStatus,
): DeliveryStatus | null {
  switch (status) {
    case FulfilmentStatus.OUT_FOR_DELIVERY:
      return DeliveryStatus.OUT_FOR_DELIVERY;
    case FulfilmentStatus.DELIVERED:
      return DeliveryStatus.DELIVERED;
    case FulfilmentStatus.CANCELED:
      return DeliveryStatus.CANCELED;
    default:
      return null;
  }
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
            delivery: {
              select: {
                id: true,
                status: true,
                driverId: true,
                driver: { select: { id: true, name: true } },
              },
            },
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
        driverId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const driverRecord = input.driverId
        ? await ctx.db.driver.findUnique({
            where: { id: input.driverId },
            select: { id: true, isActive: true },
          })
        : null;

      if (input.driverId && !driverRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Driver not found",
        });
      }

      if (driverRecord && !driverRecord.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Driver is inactive",
        });
      }

      if ((input.deliveryCents ?? 0) > 0 && !driverRecord) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Assign a driver when a delivery fee is charged.",
        });
      }

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
          delivery: {
            create: {
              status: driverRecord
                ? DeliveryStatus.SCHEDULED
                : DeliveryStatus.PENDING,
              notes: input.note ?? null,
              ...(driverRecord && {
                driver: { connect: { id: driverRecord.id } },
              }),
            },
          },
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

      await notifyOrderCreated(ctx, order.id);
      if (driverRecord?.id) {
        await notifyDriverAssignment(ctx, order.id, driverRecord.id);
      }

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
        name: true,
        description: true,
        image: true,
        link: true,
        api: true,
        links: true,
        customerName: true,
        suburb: true,
        city: true,
        supplierId: true,
        auditLogs: true,
        payouts: true,
        payments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            amountCents: true,
            currency: true,
            status: true,
            provider: true,
            providerRef: true,
            receiptUrl: true,
            createdAt: true,
          },
        },
        price: true,
        deliveryCents: true,
        currency: true,
        supplier: { select: { id: true, name: true, phone: true } },
        customerPhone: true,
        customerEmail: true,
        addressLine1: true,
        estimatedKg: true,
        caretakerId: true,
        delivery: {
          select: {
            id: true,
            status: true,
            driverId: true,
            notes: true,
            trackingCode: true,
            proofPhotoUrl: true,
            pickupWindowStart: true,
            pickupWindowEnd: true,
            dropoffWindowStart: true,
            dropoffWindowEnd: true,
            pickupAt: true,
            deliveredAt: true,
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                suburb: true,
                city: true,
                vehicle: true,
                isActive: true,
              },
            },
          },
        },
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

      const derived = deriveDeliveryStatus(input.status);
      if (derived) {
        const timestampData =
          derived === DeliveryStatus.OUT_FOR_DELIVERY
            ? { pickupAt: new Date() }
            : derived === DeliveryStatus.DELIVERED
              ? { deliveredAt: new Date() }
              : {};
        await ctx.db.delivery.upsert({
          where: { orderId: input.orderId },
          create: {
            order: { connect: { id: input.orderId } },
            status: derived,
            ...timestampData,
          },
          update: {
            status: derived,
            ...timestampData,
          },
        });
      }

      await ctx.db.auditLog.create({
        data: {
          orderId: input.orderId,
          actorId: ctx.session.user.id,
          action: "STATUS_CHANGE",
          payload: { from: ord.status, to: input.status },
        },
      });

      await notifyOrderStatusChanged(ctx, input.orderId, input.status);

      return updated;
    }),

  // Caretaker/Admin: update arbitrary fields (status via changeStatus route)
  update: caretakerProcedure
    .input(updateOrderInput)
    .mutation(async ({ ctx, input }) => {
      const {
        orderId,
        supplierId,
        caretakerId,
        driverId,
        deliveryStatus,
        pickupWindowStart,
        pickupWindowEnd,
        dropoffWindowStart,
        dropoffWindowEnd,
        deliveryNotes,
        deliveryTrackingCode,
        proofPhotoUrl,
        priceCents,
        deliveryCents,
        ...rest
      } = input;

      const current = await ctx.db.order.findUnique({
        where: { id: orderId },
        select: {
          deliveryCents: true,
          delivery: { select: { driverId: true } },
        },
      });

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      const data: Prisma.OrderUpdateInput = { ...rest };
      if (priceCents !== undefined) {
        data.price = priceCents;
      }
      if (deliveryCents !== undefined) {
        data.deliveryCents = deliveryCents;
      }
      if (supplierId !== undefined) {
        data.supplier = supplierId
          ? { connect: { id: supplierId } }
          : { disconnect: true };
      }
      if (caretakerId !== undefined) {
        data.caretaker = caretakerId
          ? { connect: { id: caretakerId } }
          : { disconnect: true };
      }

      let nextDriverId =
        driverId === undefined
          ? current.delivery?.driverId ?? null
          : driverId ?? null;

      if (driverId !== undefined && driverId !== null) {
        const driver = await ctx.db.driver.findUnique({
          where: { id: driverId },
          select: { id: true, isActive: true },
        });

        if (!driver) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Driver not found",
          });
        }

        if (!driver.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Driver is inactive",
          });
        }

        nextDriverId = driver.id;
      }

      const nextDeliveryCents =
        deliveryCents ?? current.deliveryCents ?? 0;

      if (nextDeliveryCents > 0 && !nextDriverId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Assign a driver when a delivery fee is charged.",
        });
      }

      const needsDeliveryUpdate =
        driverId !== undefined ||
        deliveryStatus !== undefined ||
        pickupWindowStart !== undefined ||
        pickupWindowEnd !== undefined ||
        dropoffWindowStart !== undefined ||
        dropoffWindowEnd !== undefined ||
        deliveryNotes !== undefined ||
        deliveryTrackingCode !== undefined ||
        proofPhotoUrl !== undefined;

      const parseDate = (value?: string | null) =>
        value && value.length > 0 ? new Date(value) : null;

      const updated = await ctx.db.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data,
        });

        if (needsDeliveryUpdate) {
          const deliveryData: Prisma.DeliveryUpdateInput = {};

          if (driverId !== undefined) {
            deliveryData.driver = nextDriverId
              ? { connect: { id: nextDriverId } }
              : { disconnect: true };
          }
          if (deliveryStatus !== undefined) {
            deliveryData.status = deliveryStatus;
          }
          if (pickupWindowStart !== undefined) {
            deliveryData.pickupWindowStart = parseDate(pickupWindowStart);
          }
          if (pickupWindowEnd !== undefined) {
            deliveryData.pickupWindowEnd = parseDate(pickupWindowEnd);
          }
          if (dropoffWindowStart !== undefined) {
            deliveryData.dropoffWindowStart = parseDate(dropoffWindowStart);
          }
          if (dropoffWindowEnd !== undefined) {
            deliveryData.dropoffWindowEnd = parseDate(dropoffWindowEnd);
          }
          if (deliveryNotes !== undefined) {
            deliveryData.notes = deliveryNotes ?? null;
          }
          if (deliveryTrackingCode !== undefined) {
            deliveryData.trackingCode = deliveryTrackingCode ?? null;
          }
          if (proofPhotoUrl !== undefined) {
            deliveryData.proofPhotoUrl = proofPhotoUrl ?? null;
          }

          await tx.delivery.upsert({
            where: { orderId },
            create: {
              order: { connect: { id: orderId } },
              status: deliveryStatus ?? DeliveryStatus.PENDING,
              pickupWindowStart: parseDate(pickupWindowStart) ?? undefined,
              pickupWindowEnd: parseDate(pickupWindowEnd) ?? undefined,
              dropoffWindowStart: parseDate(dropoffWindowStart) ?? undefined,
              dropoffWindowEnd: parseDate(dropoffWindowEnd) ?? undefined,
              notes: deliveryNotes ?? null,
              trackingCode: deliveryTrackingCode ?? null,
              proofPhotoUrl: proofPhotoUrl ?? null,
              ...(nextDriverId
                ? { driver: { connect: { id: nextDriverId } } }
                : {}),
            },
            update: deliveryData,
          });
        }

        return updatedOrder;
      });

      if (driverId !== undefined && nextDriverId) {
        await notifyDriverAssignment(ctx, orderId, nextDriverId);
      }

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

      const derived = deriveDeliveryStatus(input.status);
      if (derived) {
        const timestampData =
          derived === DeliveryStatus.OUT_FOR_DELIVERY
            ? { pickupAt: new Date() }
            : derived === DeliveryStatus.DELIVERED
              ? { deliveredAt: new Date() }
              : {};
        await ctx.db.delivery.upsert({
          where: { orderId: input.orderId },
          create: {
            order: { connect: { id: input.orderId } },
            status: derived,
            ...timestampData,
          },
          update: {
            status: derived,
            ...timestampData,
          },
        });
      }

      await ctx.db.auditLog.create({
        data: {
          orderId: input.orderId,
          actorId: ctx.session.user.id,
          action: "SUPPLIER_STATUS",
          payload: { from: ord.status, to: input.status },
        },
      });

      await notifyOrderStatusChanged(ctx, input.orderId, input.status);

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

  createLaundry: publicProcedure
    .input(createLaundryInput)
    .mutation(async ({ ctx, input }) => {
      const ensureCreator = async () => {
        if (ctx.session?.user?.id) return ctx.session.user.id;
        if (input.customerEmail) {
          const guest = await ctx.db.user.upsert({
            where: { email: input.customerEmail },
            update: { name: input.customerName },
            create: {
              email: input.customerEmail,
              name: input.customerName,
              role: Role.CUSTOMER,
            },
          });
          return guest.id;
        }
        const guest = await ctx.db.user.create({
          data: {
            name: input.customerName,
            role: Role.CUSTOMER,
          },
        });
        return guest.id;
      };

      const creatorId = await ensureCreator();
      const qty = Math.max(1, Math.round(input.estimatedKg));
      const priceCents = qty * LAUNDRY_PRICE_PER_KG_CENTS;
      const deliveryCents = LAUNDRY_DELIVERY_CENTS;
      const descriptionParts = [input.serviceType, input.instructions].filter(Boolean);

      const order = await ctx.db.order.create({
        data: {
          name: "Laundry Order",
          description: descriptionParts.join(" • ") || "Laundry service order",
          price: priceCents,
          deliveryCents,
          link: "laundry",
          api: "laundry",
          links: [],
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail ?? null,
          addressLine1: input.addressLine1,
          suburb: input.suburb,
          city: input.city,
          estimatedKg: input.estimatedKg,
          createdBy: { connect: { id: creatorId } },
          status: FulfilmentStatus.NEW,
          delivery: {
            create: {
              status: DeliveryStatus.PENDING,
            },
          },
        },
        select: { id: true },
      });

      await notifyOrderCreated(ctx, order.id);

      return { id: order.id };
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
      await notifyPayoutUpdate(ctx, input.orderId, "PENDING", input.amountCents);
      return payout;
    }),

  // Caretaker/Admin: set payout status (RELEASED / FAILED)
  setPayoutStatus: protectedProcedure
    .input(setPayoutStatusInput)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.supplierPayout.update({
        where: { id: input.payoutId },
        data: {
          status: input.status,
          releasedAt: input.status === "RELEASED" ? new Date() : null,
        },
      });
      await ctx.db.auditLog.create({
        data: {
          orderId: updated.orderId,
          actorId: ctx.session.user.id,
          action: "PAYOUT_STATUS",
          payload: { payoutId: updated.id, status: input.status },
        },
      });
      await notifyPayoutUpdate(ctx, updated.orderId, input.status, updated.amountCents);
      return updated;
    }),

  // Caretaker/Admin: add a payment entry
  addPayment: protectedProcedure
    .input(addPaymentInput)
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.db.payment.create({
        data: {
          orderId: input.orderId,
          amountCents: input.amountCents,
          provider: input.provider,
          providerRef: input.providerRef,
          receiptUrl: input.receiptUrl,
          status: input.status ?? PaymentStatus.PENDING,
        },
      });
      await ctx.db.auditLog.create({
        data: {
          orderId: input.orderId,
          actorId: ctx.session.user.id,
          action: "ADD_PAYMENT",
          payload: {
            paymentId: payment.id,
            amountCents: input.amountCents,
            provider: input.provider,
            status: payment.status,
          },
        },
      });
      await notifyPaymentUpdate(
        ctx,
        payment.orderId,
        payment.status ?? PaymentStatus.PENDING,
        payment.amountCents,
        payment.provider,
      );
      return payment;
    }),

  // Caretaker/Admin: set payment status
  setPaymentStatus: protectedProcedure
    .input(setPaymentStatusInput)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.payment.update({
        where: { id: input.paymentId },
        data: {
          status: input.status,
          ...(input.providerRef !== undefined ? { providerRef: input.providerRef } : {}),
          ...(input.receiptUrl !== undefined ? { receiptUrl: input.receiptUrl } : {}),
        },
      });
      await ctx.db.auditLog.create({
        data: {
          orderId: updated.orderId,
          actorId: ctx.session.user.id,
          action: "PAYMENT_STATUS",
          payload: { paymentId: updated.id, status: input.status },
        },
      });
      await notifyPaymentUpdate(
        ctx,
        updated.orderId,
        updated.status,
        updated.amountCents,
        updated.provider,
      );
      return updated;
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
