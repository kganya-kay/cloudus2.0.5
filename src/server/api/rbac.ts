// rbac.ts
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { protectedProcedure } from "./trpc";
import { z } from "zod";

export const hasRole = (allowed: Role[]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const role = ctx.session?.user.role;
    if (!role || !allowed.includes(role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  });

export const caretakerProcedure = hasRole([Role.ADMIN, Role.CARETAKER]);
export const adminProcedure = hasRole([Role.ADMIN]);
export const supplierProcedure = hasRole([Role.SUPPLIER, Role.ADMIN]);

// Narrow supplier to its own orders (expects { orderId })
const orderIdSchema = z.object({ orderId: z.number().int().positive() });

export const supplierOwnsOrder = supplierProcedure.use(async ({ ctx, input, next }) => {
  const userSupplierId = ctx.session?.user.supplierId;
  if (!userSupplierId) throw new TRPCError({ code: "FORBIDDEN" });

  const parsed = orderIdSchema.safeParse(input);
  if (!parsed.success) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "orderId required" });
  }
  const { orderId } = parsed.data;

  const order = await ctx.db.order.findUnique({
    where: { id: orderId },
    select: { supplierId: true },
  });

  if (!order || order.supplierId !== userSupplierId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});
