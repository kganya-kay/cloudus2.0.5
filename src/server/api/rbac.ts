import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { protectedProcedure } from "./trpc";

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

// Narrow supplier to its own orders if needed
export const supplierOwnsOrder = supplierProcedure.use(async ({ ctx, input, next, path }) => {
  const userSupplierId = ctx.session!.user.supplierId;
  if (!userSupplierId) throw new TRPCError({ code: "FORBIDDEN" });

  // expects input to have orderId
  const orderId = typeof input === "object" && input !== null && "orderId" in input
    ? (input as { orderId?: number }).orderId
    : undefined;
  if (!orderId) throw new TRPCError({ code: "BAD_REQUEST", message: "orderId required" });

  const order = await ctx.db.order.findUnique({
    where: { id: orderId },
    select: { supplierId: true },
  });

  if (!order || order.supplierId !== userSupplierId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});
