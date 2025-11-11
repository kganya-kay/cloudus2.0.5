// src/server/api/routers/supplier.ts
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createTRPCRouter } from "~/server/api/trpc";
import { caretakerProcedure } from "../rbac";
import { TRPCError } from "@trpc/server";

export const supplierRouter = createTRPCRouter({
  update: caretakerProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).optional(),
        phone: z.string().min(3).optional(),
        email: z.string().email().nullable().optional(),
        suburb: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
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
