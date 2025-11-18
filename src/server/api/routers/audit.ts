import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const listInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(25),
    cursor: z.string().optional(),
  })
  .optional();

export const auditRouter = createTRPCRouter({
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const viewer = ctx.session?.user;
    const allowedRoles: Role[] = [Role.ADMIN, Role.CARETAKER];
    if (!viewer || !allowedRoles.includes(viewer.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const limit = input?.limit ?? 25;
    const logs = await ctx.db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: input?.cursor ? { id: input.cursor } : undefined,
      include: {
        Order: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            customerName: true,
          },
        },
      },
    });
    let nextCursor: string | undefined = undefined;
    if (logs.length > limit) {
      const next = logs.pop();
      nextCursor = next?.id;
    }
    return {
      items: logs.map((log) => ({
        id: log.id,
        orderId: log.orderId,
        action: log.action,
        payload: log.payload,
        createdAt: log.createdAt,
        order: log.Order,
        actorId: log.actorId,
      })),
      nextCursor,
    };
  }),
});
