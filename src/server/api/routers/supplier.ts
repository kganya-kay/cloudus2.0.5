// src/server/api/routers/supplier.ts
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter } from "~/server/api/trpc";
import { caretakerProcedure } from "../rbac";

export const supplierRouter = createTRPCRouter({
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
});
