import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const scopeInput = z.object({
  scope: z.enum(["EVENT", "PROJECT", "SESSION"]),
  scopeId: z.string().min(1).max(80),
});

type LiveStore = {
  liveMessage: {
    findMany: (args: {
      where: { scope: string; scopeId: string };
      orderBy: { createdAt: "desc" };
      take: number;
      include: { user: { select: { id: true; name: true; image: true } } };
    }) => Promise<Array<{ id: string; body: string; createdAt: Date; user: { id: string; name: string | null; image: string | null } }>>;
    create: (args: {
      data: { scope: string; scopeId: string; userId: string; body: string };
      include: { user: { select: { id: true; name: true; image: true } } };
    }) => Promise<{ id: string; body: string; createdAt: Date; user: { id: string; name: string | null; image: string | null } }>;
  };
};

const liveDb = (db: unknown) => db as LiveStore;

export const liveRouter = createTRPCRouter({
  chat: publicProcedure
    .input(scopeInput.extend({ take: z.number().int().min(1).max(80).optional() }))
    .query(async ({ ctx, input }) => {
      return liveDb(ctx.db).liveMessage.findMany({
        where: { scope: input.scope, scopeId: input.scopeId },
        orderBy: { createdAt: "desc" },
        take: input.take ?? 40,
        include: { user: { select: { id: true, name: true, image: true } } },
      });
    }),

  say: protectedProcedure
    .input(scopeInput.extend({ body: z.string().trim().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      return liveDb(ctx.db).liveMessage.create({
        data: {
          scope: input.scope,
          scopeId: input.scopeId,
          userId: ctx.session.user.id,
          body: input.body,
        },
        include: { user: { select: { id: true, name: true, image: true } } },
      });
    }),

  goLive: protectedProcedure
    .input(
      z.object({
        eventId: z.number().int().positive().optional(),
        projectId: z.number().int().positive().optional(),
        streamUrl: z.string().trim().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.eventId) {
        const event = await ctx.db.event.findUnique({
          where: { id: input.eventId },
          select: { id: true, createdById: true, hostId: true },
        });
        if (!event) throw new TRPCError({ code: "NOT_FOUND" });
        if (event.createdById !== ctx.session.user.id && event.hostId !== ctx.session.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return ctx.db.event.update({
          where: { id: input.eventId },
          data: { streamUrl: input.streamUrl, status: "Live" },
        });
      }
      if (input.projectId) {
        const project = await ctx.db.project.findUnique({
          where: { id: input.projectId },
          select: { id: true, createdById: true },
        });
        if (!project) throw new TRPCError({ code: "NOT_FOUND" });
        if (project.createdById !== ctx.session.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return ctx.db.project.update({
          where: { id: input.projectId },
          data: { heroVideo: input.streamUrl },
        });
      }
      throw new TRPCError({ code: "BAD_REQUEST", message: "Need a room." });
    }),
});
