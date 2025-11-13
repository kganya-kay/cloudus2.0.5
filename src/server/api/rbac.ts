// rbac.ts
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { protectedProcedure } from "./trpc";
import { z } from "zod";
import { isSuperAdminEmail } from "~/server/auth/super-admin";

export const hasRole = (allowed: Role[]) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const email = ctx.session?.user.email ?? null;
    const role = ctx.session?.user.role;

    // Super admin bypasses all role checks
    if (isSuperAdminEmail(email)) {
      return next();
    }

    if (!role || !allowed.includes(role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  });

export const caretakerProcedure = hasRole([Role.ADMIN, Role.CARETAKER]);
export const adminProcedure = hasRole([Role.ADMIN]);
export const supplierProcedure = hasRole([Role.SUPPLIER, Role.ADMIN]);
export const customerProcedure = hasRole([Role.CUSTOMER, Role.ADMIN]);

// Narrow supplier to its own orders (expects { orderId })
const orderIdSchema = z.object({ orderId: z.number().int().positive() });

export const supplierOwnsOrder = supplierProcedure.use(async ({ ctx, input, next }) => {
  // Admins and super admin bypass supplier ownership check
  const email = ctx.session?.user.email ?? null;
  if (isSuperAdminEmail(email) || ctx.session?.user.role === Role.ADMIN) {
    return next();
  }

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
