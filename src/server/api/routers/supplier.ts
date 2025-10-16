// src/server/api/routers/supplier.ts
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter } from "~/server/api/trpc";
import { caretakerProcedure } from "../rbac";

export const supplierRouter = createTRPCRouter({
  list: caretakerProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          onlyActive: z.boolean().optional(),
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
            ]
          : [];

      const where: Prisma.SupplierWhereInput = {
        ...(input?.onlyActive !== undefined ? { isActive: input.onlyActive } : {}),
        ...(OR.length > 0 ? { OR } : {}),
      };

      return ctx.db.supplier.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      });
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
