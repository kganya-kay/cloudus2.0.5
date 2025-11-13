// src/server/api/routers/driver.ts
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { DeliveryStatus, Role } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { caretakerProcedure } from "../rbac";
import { TRPCError } from "@trpc/server";

export const driverRouter = createTRPCRouter({
  update: caretakerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).optional(),
        phone: z.string().min(3).optional(),
        email: z.string().email().nullable().optional(),
        suburb: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        vehicle: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
        rating: z.number().min(0).max(5).nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      return ctx.db.driver.update({ where: { id }, data: rest });
    }),

  create: caretakerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(3),
        email: z.string().email().optional(),
        suburb: z.string().optional(),
        city: z.string().optional(),
        vehicle: z.string().optional(),
        rating: z.number().min(0).max(5).optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.driver.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email,
          suburb: input.suburb,
          city: input.city,
          vehicle: input.vehicle,
          rating: input.rating,
          notes: input.notes,
          isActive: input.isActive ?? true,
        },
      });
    }),

  getById: caretakerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.driver.findUniqueOrThrow({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          suburb: true,
          city: true,
          vehicle: true,
          isActive: true,
          rating: true,
          notes: true,
          createdAt: true,
          lastLocationLat: true,
          lastLocationLng: true,
          lastLocationAccuracy: true,
          lastLocationAt: true,
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
      const OR: any[] =
        q && q.length > 0
          ? [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { suburb: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { vehicle: { contains: q, mode: "insensitive" } },
            ]
          : [];

      const where: any = {
        ...(input?.onlyActive !== undefined ? { isActive: input.onlyActive } : {}),
        ...(OR.length > 0 ? { OR } : {}),
      };

      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const [items, total] = await Promise.all([
        ctx.db.driver.findMany({
          where,
          orderBy: [{ isActive: "desc" }, { name: "asc" }],
          skip,
          take,
        }),
        ctx.db.driver.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  toggleActive: caretakerProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.driver.update({ where: { id: input.id }, data: { isActive: input.isActive } });
    }),

  delete: caretakerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const driverId = input.id;

      const [users, deliveries] = await Promise.all([
        ctx.db.user.count({ where: { driverId } }),
        ctx.db.delivery.count({ where: { driverId } }),
      ]);

      const blockers: string[] = [];
      if (users > 0) blockers.push("linked users");
      if (deliveries > 0) blockers.push("linked deliveries");

      if (blockers.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete driver with ${blockers.join(", ")}. Remove or reassign first.`,
        });
      }

      try {
        await ctx.db.driver.delete({ where: { id: driverId } });
        return { ok: true as const };
      } catch (err: unknown) {
        if ((err as any)?.code === "P2025") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Driver not found" });
        }
        throw err;
      }
    }),

  dashboard: protectedProcedure
    .input(z.object({ driverId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const sessionRole = session.user.role as Role | null;
      const requestedDriverId = input?.driverId?.trim();
      let driverId: string | null = requestedDriverId ?? null;

      if (driverId) {
        const canImpersonate =
          sessionRole === Role.ADMIN || sessionRole === Role.CARETAKER;
        if (!canImpersonate) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
      } else {
        const userRecord = await ctx.db.user.findUnique({
          where: { id: session.user.id },
          select: { driverId: true, role: true },
        });
        if (!userRecord?.driverId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No driver profile found for this account.",
          });
        }
        if (
          userRecord.role !== Role.DRIVER &&
          sessionRole !== Role.ADMIN &&
          sessionRole !== Role.CARETAKER
        ) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        driverId = userRecord.driverId;
      }

      if (!driverId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Driver required" });
      }

      const driver = await ctx.db.driver.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          suburb: true,
          city: true,
          vehicle: true,
          isActive: true,
          rating: true,
          notes: true,
          createdAt: true,
          lastLocationLat: true,
          lastLocationLng: true,
          lastLocationAccuracy: true,
          lastLocationAt: true,
        },
      });

      if (!driver) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Driver not found" });
      }

      const MAX_ITEMS = 100;
      const deliveries = await ctx.db.delivery.findMany({
        where: { driverId },
        orderBy: { createdAt: "desc" },
        take: MAX_ITEMS,
        select: {
          id: true,
          status: true,
          pickupWindowStart: true,
          pickupWindowEnd: true,
          dropoffWindowStart: true,
          dropoffWindowEnd: true,
          pickupAt: true,
          deliveredAt: true,
          notes: true,
          trackingCode: true,
          proofPhotoUrl: true,
          createdAt: true,
          updatedAt: true,
          order: {
            select: {
              id: true,
              code: true,
              name: true,
              customerName: true,
              customerPhone: true,
              suburb: true,
              city: true,
              deliveryCents: true,
              price: true,
              currency: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      const activeStatuses: DeliveryStatus[] = [
        DeliveryStatus.PENDING,
        DeliveryStatus.SCHEDULED,
        DeliveryStatus.PICKUP_IN_PROGRESS,
        DeliveryStatus.OUT_FOR_DELIVERY,
      ];

      const activeDeliveries = deliveries.filter((d) =>
        activeStatuses.includes(d.status),
      );
      const completedDeliveries = deliveries.filter(
        (d) => d.status === DeliveryStatus.DELIVERED,
      );
      const canceledDeliveries = deliveries.filter((d) =>
        [DeliveryStatus.CANCELED, DeliveryStatus.FAILED].includes(d.status),
      );

      const payoutRows = deliveries
        .map((d) => {
          const amountCents = d.order?.deliveryCents ?? 0;
          return {
            id: d.id,
            deliveryStatus: d.status,
            deliveredAt: d.deliveredAt,
            createdAt: d.createdAt,
            amountCents,
            order: d.order,
          };
        })
        .filter((row) => row.amountCents > 0);

      const lifetimePayoutCents = payoutRows
        .filter((row) => row.deliveryStatus === DeliveryStatus.DELIVERED)
        .reduce((sum, row) => sum + row.amountCents, 0);

      const pendingPayoutCents = payoutRows
        .filter(
          (row) =>
            row.deliveryStatus !== DeliveryStatus.DELIVERED &&
            row.deliveryStatus !== DeliveryStatus.CANCELED &&
            row.deliveryStatus !== DeliveryStatus.FAILED,
        )
        .reduce((sum, row) => sum + row.amountCents, 0);

      const payoutHistory = payoutRows
        .sort((a, b) => {
          const aTime = (a.deliveredAt ?? a.createdAt).getTime();
          const bTime = (b.deliveredAt ?? b.createdAt).getTime();
          return bTime - aTime;
        })
        .slice(0, 20);

      return {
        driver,
        stats: {
          assigned: deliveries.length,
          active: activeDeliveries.length,
          completed: completedDeliveries.length,
          canceled: canceledDeliveries.length,
          lifetimePayoutCents,
          pendingPayoutCents,
        },
        upcomingDeliveries: activeDeliveries.slice(0, 10),
        recentDeliveries: deliveries.slice(0, 15),
        payoutHistory,
      };
    }),

  shareLocation: protectedProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        accuracy: z.number().min(0).max(10000).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = ctx.session;
      if (!session?.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const userRecord = await ctx.db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, driverId: true },
      });

      if (!userRecord || userRecord.role !== Role.DRIVER || !userRecord.driverId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const driver = await ctx.db.driver.update({
        where: { id: userRecord.driverId },
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
      });

      return { driver };
    }),
});
