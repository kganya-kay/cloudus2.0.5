// src/server/api/routers/driver.ts
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter } from "~/server/api/trpc";
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
      return (ctx.db as any).driver.update({ where: { id }, data: rest });
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
      return (ctx.db as any).driver.create({
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
      return (ctx.db as any).driver.findUniqueOrThrow({
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
        (ctx.db as any).driver.findMany({
          where,
          orderBy: [{ isActive: "desc" }, { name: "asc" }],
          skip,
          take,
        }),
        (ctx.db as any).driver.count({ where }),
      ]);

      return { items, total, page, pageSize };
    }),

  toggleActive: caretakerProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return (ctx.db as any).driver.update({ where: { id: input.id }, data: { isActive: input.isActive } });
    }),

  delete: caretakerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const driverId = input.id;

      const [users] = await Promise.all([
        (ctx.db as any).user.count({ where: { driverId } }),
      ]);

      const blockers: string[] = [];
      if (users > 0) blockers.push("linked users");

      if (blockers.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete driver with ${blockers.join(", ")}. Remove or reassign first.`,
        });
      }

      try {
        await (ctx.db as any).driver.delete({ where: { id: driverId } });
        return { ok: true as const };
      } catch (err: unknown) {
        if ((err as any)?.code === "P2025") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Driver not found" });
        }
        throw err;
      }
    }),
});
