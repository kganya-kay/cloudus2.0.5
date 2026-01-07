// src/server/api/routers/supplier.ts
import { z } from "zod";
import { Prisma, Role, FulfilmentStatus } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { caretakerProcedure } from "../rbac";
import { TRPCError } from "@trpc/server";

const DASHBOARD_ORDER_LIMIT = 100;
const DASHBOARD_SHOP_ITEMS = 12;
const DASHBOARD_PAYOUTS = 25;

const activeOrderStatuses: FulfilmentStatus[] = [
  FulfilmentStatus.NEW,
  FulfilmentStatus.SOURCING_SUPPLIER,
  FulfilmentStatus.SUPPLIER_CONFIRMED,
  FulfilmentStatus.IN_PROGRESS,
  FulfilmentStatus.READY_FOR_DELIVERY,
  FulfilmentStatus.OUT_FOR_DELIVERY,
];
const completedOrderStatuses: FulfilmentStatus[] = [
  FulfilmentStatus.DELIVERED,
  FulfilmentStatus.CLOSED,
];
const canceledOrderStatuses: FulfilmentStatus[] = [
  FulfilmentStatus.CANCELED,
];

const summaryFromOrders = (orders: Array<{ status: FulfilmentStatus }>) => {
  let active = 0;
  let completed = 0;
  let canceled = 0;
  for (const order of orders) {
    if (activeOrderStatuses.includes(order.status)) active += 1;
    else if (completedOrderStatuses.includes(order.status)) completed += 1;
    else if (canceledOrderStatuses.includes(order.status)) canceled += 1;
  }
  return { active, completed, canceled };
};

const locationInput = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(10000).nullable().optional(),
});

export const supplierRouter = createTRPCRouter({
  dashboard: protectedProcedure
    .input(z.object({ supplierId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const viewerRole = ctx.session.user.role;
      const canImpersonate =
        viewerRole === Role.ADMIN || viewerRole === Role.CARETAKER;

      let supplierId = input?.supplierId ?? null;
      if (supplierId && !canImpersonate) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (!supplierId) {
        const userRecord = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { supplierId: true, role: true },
        });
        if (!userRecord?.supplierId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No supplier profile linked to this account.",
          });
        }
        if (
          userRecord.role !== Role.SUPPLIER &&
          !canImpersonate
        ) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        supplierId = userRecord.supplierId;
      }

      if (!supplierId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Supplier ID required.",
        });
      }

      const [supplierRecord, orders, payoutRows, shopItems] = await Promise.all([
        ctx.db.supplier.findUnique({
          where: { id: supplierId },
          select: {
            id: true,
            name: true,
            phone: true,
            addressLine1: true,
            email: true,
            city: true,
            suburb: true,
            isActive: true,
            rating: true,
            pricePerKg: true,
            createdAt: true,
            lastLocationLat: true,
            lastLocationLng: true,
            lastLocationAccuracy: true,
            lastLocationAt: true,
          },
        } as any),
        ctx.db.order.findMany({
          where: { supplierId },
          orderBy: { createdAt: "desc" },
          take: DASHBOARD_ORDER_LIMIT,
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            price: true,
            deliveryCents: true,
            currency: true,
            customerName: true,
            suburb: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        ctx.db.supplierPayout.findMany({
          where: { supplierId },
          orderBy: [{ releasedAt: "desc" }, { id: "desc" }],
          take: DASHBOARD_PAYOUTS,
          select: {
            id: true,
            amountCents: true,
            status: true,
            releasedAt: true,
            orderId: true,
            Order: { select: { id: true, code: true, createdAt: true } },
          },
        }),
        ctx.db.shopItem.findMany({
          where: { supplierId },
          orderBy: { createdAt: "desc" },
          take: DASHBOARD_SHOP_ITEMS,
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            createdAt: true,
            image: true,
          },
        }),
      ]);

      if (!supplierRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found." });
      }
      const supplierBase = supplierRecord as unknown as Record<string, unknown>;
      const supplier = {
        ...supplierBase,
        addressLine1:
          typeof supplierBase.addressLine1 === "string"
            ? (supplierBase.addressLine1 as string)
            : null,
        lastLocationLat: (supplierRecord as any)?.lastLocationLat ?? null,
        lastLocationLng: (supplierRecord as any)?.lastLocationLng ?? null,
        lastLocationAccuracy: (supplierRecord as any)?.lastLocationAccuracy ?? null,
        lastLocationAt: (supplierRecord as any)?.lastLocationAt ?? null,
      } as {
        id: string;
        name: string | null;
        phone: string | null;
        addressLine1: string | null;
        email: string | null;
        city: string | null;
        suburb: string | null;
        isActive: boolean;
        rating: number | null;
        pricePerKg: number | null;
        createdAt: Date;
        lastLocationLat: number | null;
        lastLocationLng: number | null;
        lastLocationAccuracy: number | null;
        lastLocationAt: Date | null;
      };

      const { active, completed, canceled } = summaryFromOrders(orders);
      const payouts = payoutRows.map((row) => ({
        id: row.id,
        amountCents: row.amountCents,
        status: row.status,
        releasedAt: row.releasedAt,
        orderId: row.orderId,
        order: row.Order,
      }));

      const payoutsByStatus = payouts.reduce(
        (acc, p) => {
          acc[p.status] = (acc[p.status] ?? 0) + (p.amountCents ?? 0);
          return acc;
        },
        {} as Record<string, number>,
      );

      const activeOrders = orders.filter((o) =>
        activeOrderStatuses.includes(o.status),
      );
      const recentOrders = orders.slice(0, 15);

      return {
        supplier,
        stats: {
          totalOrders: orders.length,
          activeOrders: active,
          completedOrders: completed,
          canceledOrders: canceled,
          pendingPayoutCents: payoutsByStatus.PENDING ?? 0,
          releasedPayoutCents: payoutsByStatus.RELEASED ?? 0,
          failedPayoutCents: payoutsByStatus.FAILED ?? 0,
        },
        activeOrders,
        recentOrders,
        payouts,
        shopItems,
      };
    }),

  portalCreateShopItem: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(5),
        type: z.string().min(1),
        priceCents: z.number().int().nonnegative(),
        image: z.string().url().nullable().optional(),
        link: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const viewerRole = ctx.session.user.role;
      const userRecord = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { supplierId: true, role: true },
      });

      const supplierId = userRecord?.supplierId ?? null;
      if (!supplierId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No supplier profile linked to this account.",
        });
      }
      if (
        userRecord?.role !== Role.SUPPLIER &&
        viewerRole !== Role.ADMIN &&
        viewerRole !== Role.CARETAKER
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.shopItem.create({
        data: {
          name: input.name,
          description: input.description,
          type: input.type,
          price: input.priceCents,
          image:
            input.image ??
            "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf",
          link: input.link ?? "",
          api: "",
          createdBy: { connect: { id: ctx.session.user.id } },
          contributors: { connect: [{ id: ctx.session.user.id }] },
      supplier: { connect: { id: supplierId } },
      },
    });
  }),

  portalUpdateLocation: protectedProcedure
    .input(
      z.object({
        addressLine1: z.string().min(3),
        suburb: z.string().min(1),
        city: z.string().min(1),
        location: locationInput.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { supplierId: true, role: true },
      });

      if (!user?.supplierId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No supplier profile linked to this account.",
        });
      }
      if (
        user.role !== Role.SUPPLIER &&
        user.role !== Role.ADMIN &&
        user.role !== Role.CARETAKER
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const supplier = await ctx.db.supplier.update({
        where: { id: user.supplierId },
        data: {
          addressLine1: input.addressLine1,
          suburb: input.suburb,
          city: input.city,
          ...(input.location
            ? {
                lastLocationLat: input.location.lat,
                lastLocationLng: input.location.lng,
                lastLocationAccuracy: input.location.accuracy ?? null,
                lastLocationAt: new Date(),
              }
            : {}),
        },
        select: {
          id: true,
          addressLine1: true,
          suburb: true,
          city: true,
          lastLocationLat: true,
          lastLocationLng: true,
          lastLocationAccuracy: true,
          lastLocationAt: true,
        },
      });

      return { supplier };
    }),

  shareLocation: protectedProcedure
    .input(locationInput)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { supplierId: true, role: true },
      });

      if (!user?.supplierId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No supplier profile linked to this account.",
        });
      }

      if (
        user.role !== Role.SUPPLIER &&
        user.role !== Role.ADMIN &&
        user.role !== Role.CARETAKER
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const supplierResult = await ctx.db.supplier.update({
        where: { id: user.supplierId },
        data: {
          lastLocationLat: input.lat,
          lastLocationLng: input.lng,
          lastLocationAccuracy: input.accuracy ?? null,
          lastLocationAt: new Date(),
        },
        select: {
          id: true,
          lastLocationLat: true,
          lastLocationLng: true,
          lastLocationAccuracy: true,
          lastLocationAt: true,
        },
      } as any);
      const supplier = supplierResult as unknown as {
        id: string;
        lastLocationLat: number | null;
        lastLocationLng: number | null;
        lastLocationAccuracy: number | null;
        lastLocationAt: Date | null;
      };

      return { supplier };
    }),

  // Payout summaries: totals and weekly released sums
  payoutSummary: caretakerProcedure
    .input(z.object({ id: z.string().min(1), weeks: z.number().int().positive().max(52).default(12) }))
    .query(async ({ ctx, input }) => {
      const supplierId = input.id;
      const [pendingAgg, releasedAgg, failedAgg] = await Promise.all([
        ctx.db.supplierPayout.aggregate({
          where: { supplierId, status: "PENDING" },
          _sum: { amountCents: true },
        }),
        ctx.db.supplierPayout.aggregate({
          where: { supplierId, status: "RELEASED" },
          _sum: { amountCents: true },
        }),
        ctx.db.supplierPayout.aggregate({
          where: { supplierId, status: "FAILED" },
          _sum: { amountCents: true },
        }),
      ]);

      // Weekly: last N weeks by releasedAt
      const now = new Date();
      const since = new Date(now);
      since.setDate(since.getDate() - input.weeks * 7);
      const rows = await ctx.db.supplierPayout.findMany({
        where: { supplierId, status: "RELEASED", releasedAt: { gte: since } },
        select: { amountCents: true, releasedAt: true },
        orderBy: { releasedAt: "asc" },
      });

      // Group by ISO week starting Monday
      const weekKey = (d: Date) => {
        const dd = new Date(d);
        const day = (dd.getDay() + 6) % 7; // 0=Mon
        dd.setDate(dd.getDate() - day);
        dd.setHours(0, 0, 0, 0);
        return dd.toISOString().slice(0, 10); // YYYY-MM-DD (week start)
      };
      const byWeek = new Map<string, number>();
      for (const r of rows) {
        const k = weekKey(r.releasedAt ?? new Date());
        byWeek.set(k, (byWeek.get(k) ?? 0) + (r.amountCents ?? 0));
      }
      // Build ordered array for the last N weeks
      const weeks: { weekStart: string; amountCents: number }[] = [];
      const seed = new Date(now);
      for (let i = input.weeks - 1; i >= 0; i--) {
        const d = new Date(seed);
        d.setDate(d.getDate() - i * 7);
        const k = weekKey(d);
        weeks.push({ weekStart: k, amountCents: byWeek.get(k) ?? 0 });
      }

      return {
        totalPendingCents: pendingAgg._sum.amountCents ?? 0,
        totalReleasedCents: releasedAgg._sum.amountCents ?? 0,
        totalFailedCents: failedAgg._sum.amountCents ?? 0,
        weeks,
      };
    }),
  update: caretakerProcedure
      .input(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1).optional(),
          phone: z.string().min(3).optional(),
          email: z.string().email().nullable().optional(),
          suburb: z.string().nullable().optional(),
          city: z.string().nullable().optional(),
          type: z.string().nullable().optional(),
          description: z.string().nullable().optional(),
          pricePerKgCents: z.number().int().nonnegative().nullable().optional(),
          isActive: z.boolean().optional(),
          rating: z.number().min(0).max(5).nullable().optional(),
          notes: z.string().nullable().optional(),
        }),
      )
    .mutation(async ({ ctx, input }) => {
      const { id, pricePerKgCents, ...rest } = input;
      return ctx.db.supplier.update({
        where: { id },
        data: {
          ...rest,
          ...(pricePerKgCents !== undefined ? { pricePerKg: pricePerKgCents } : {}),
        },
      });
    }),
  create: caretakerProcedure
      .input(
        z.object({
          name: z.string().min(1),
          phone: z.string().min(3),
          email: z.string().email().optional(),
          suburb: z.string().optional(),
          city: z.string().optional(),
          type: z.string().optional(),
          description: z.string().optional(),
          pricePerKgCents: z.number().int().nonnegative().optional(),
          rating: z.number().min(0).max(5).optional(),
          notes: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supplier.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email,
          suburb: input.suburb,
          city: input.city,
          type: input.type,
          description: input.description,
          pricePerKg: input.pricePerKgCents,
          rating: input.rating,
          notes: input.notes,
          isActive: input.isActive ?? true,
        },
      });
    }),
  getById: caretakerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.supplier.findUniqueOrThrow({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          suburb: true,
          city: true,
          pricePerKg: true,
          isActive: true,
          rating: true,
          notes: true,
          createdAt: true,
          // Include supplied shop items (basic fields)
          shopItems: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
              image: true,
              createdAt: true,
            },
          },
        },
      });
    }),
  list: caretakerProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          onlyActive: z.boolean().optional(),
          page: z.number().int().positive().default(1),
          pageSize: z.number().int().positive().max(100).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const q = input?.q?.trim();
      const OR: Prisma.SupplierWhereInput[] =
        q && q.length > 0
          ? [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { suburb: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ]
          : [];

      const where: Prisma.SupplierWhereInput = {
        ...(input?.onlyActive !== undefined ? { isActive: input.onlyActive } : {}),
        ...(OR.length > 0 ? { OR } : {}),
      };

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const [items, total] = await Promise.all([
        ctx.db.supplier.findMany({
          where,
          orderBy: [{ isActive: "desc" }, { name: "asc" }],
          skip,
          take,
        }),
        ctx.db.supplier.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  toggleActive: caretakerProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.supplier.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),

  delete: caretakerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const supplierId = input.id;

      const [shopItems, orders, quotes, payouts, users, addresses] = await Promise.all([
        ctx.db.shopItem.count({ where: { supplierId } }),
        ctx.db.order.count({ where: { supplierId } }),
        ctx.db.supplierQuote.count({ where: { supplierId } }),
        ctx.db.supplierPayout.count({ where: { supplierId } }),
        ctx.db.user.count({ where: { supplierId } }),
        ctx.db.supplierAddress.count({ where: { supplierId } }),
      ]);

      const blockers: string[] = [];
      if (shopItems > 0) blockers.push("linked shop items");
      if (orders > 0) blockers.push("linked orders");
      if (quotes > 0) blockers.push("linked quotes");
      if (payouts > 0) blockers.push("linked payouts");
      if (users > 0) blockers.push("linked users");
      if (addresses > 0) blockers.push("linked addresses");

      if (blockers.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete supplier with ${blockers.join(", ")}. Remove or reassign first.`,
        });
      }

      try {
        await ctx.db.supplier.delete({ where: { id: supplierId } });
        return { ok: true as const };
      } catch (err: unknown) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2025"
        ) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
        }
        throw err;
      }
    }),
});
