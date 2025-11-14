import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      return ctx.db.notification.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }),
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: { userId: ctx.session.user.id, readAt: null },
    });
    return { count };
  }),
  markRead: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.notification.updateMany({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { readAt: new Date() },
      });
      return { updated: updated.count };
    }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const updated = await ctx.db.notification.updateMany({
      where: { userId: ctx.session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: updated.count };
  }),
});
