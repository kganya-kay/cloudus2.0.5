import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { decodeSignal, encodeSignal, LIVE_SIG, type LiveSignal } from "~/lib/live/signal";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const scopeInput = z.object({
  scope: z.enum(["EVENT", "PROJECT", "SESSION"]),
  scopeId: z.string().min(1).max(80),
});

type LiveStore = {
  liveMessage: {
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy: { createdAt: "desc" };
      take: number;
      include: { user: { select: { id: true; name: true; image: true } } };
    }) => Promise<Array<{ id: string; userId: string; body: string; createdAt: Date; user: { id: string; name: string | null; image: string | null } }>>;
    create: (args: {
      data: { scope: string; scopeId: string; userId: string; body: string };
      include: { user: { select: { id: true; name: true; image: true } } };
    }) => Promise<{ id: string; userId: string; body: string; createdAt: Date; user: { id: string; name: string | null; image: string | null } }>;
    findFirst: (args: {
      where: { id: string; userId?: string };
    }) => Promise<{ id: string; userId: string; body: string } | null>;
    update: (args: {
      where: { id: string };
      data: { body: string };
    }) => Promise<{ id: string; body: string }>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
};

const signalInput = z.object({
  k: z.enum(["on", "off", "join", "leave", "offer", "answer", "ice"]),
  hostId: z.string().optional(),
  name: z.string().max(80).optional(),
  to: z.string().optional(),
  sdp: z.string().optional(),
  candidate: z.any().optional(),
});

const liveDb = (db: unknown) => db as LiveStore;

export const liveRouter = createTRPCRouter({
  chat: publicProcedure
    .input(scopeInput.extend({ take: z.number().int().min(1).max(80).optional() }))
    .query(async ({ ctx, input }) => {
      return liveDb(ctx.db).liveMessage.findMany({
        where: {
          scope: input.scope,
          scopeId: input.scopeId,
          NOT: { body: { startsWith: LIVE_SIG } },
        },
        orderBy: { createdAt: "desc" },
        take: input.take ?? 40,
        include: { user: { select: { id: true, name: true, image: true } } },
      });
    }),

  camera: publicProcedure.input(scopeInput).query(async ({ ctx, input }) => {
    const rows = await liveDb(ctx.db).liveMessage.findMany({
      where: {
        scope: input.scope,
        scopeId: input.scopeId,
        body: { startsWith: LIVE_SIG },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    let live = false;
    let hostId: string | null = null;
    let startedAt = 0;
    for (const row of rows) {
      const next = decodeSignal(row.body);
      if (next?.k === "on") {
        live = true;
        hostId = next.hostId;
        startedAt = new Date(row.createdAt).getTime();
        break;
      }
      if (next?.k === "off") {
        return { live: false as const, hostId: next.hostId, seats: [] as Array<{ userId: string; name: string | null; image: string | null }> };
      }
    }
    if (!live) return { live: false as const, hostId: null, seats: [] };

    const seats = new Map<string, { userId: string; name: string | null; image: string | null }>();
    for (const row of [...rows].reverse()) {
      if (new Date(row.createdAt).getTime() < startedAt) continue;
      const next = decodeSignal(row.body);
      if (!next) continue;
      if (next.k === "leave") {
        seats.delete(row.userId);
        continue;
      }
      if (next.k === "on" || next.k === "join") {
        seats.set(row.userId, {
          userId: row.userId,
          name: (next.k === "join" ? next.name : null) ?? row.user.name,
          image: row.user.image,
        });
      }
    }
    if (hostId && !seats.has(hostId)) {
      const hostRow = rows.find((row) => row.userId === hostId);
      seats.set(hostId, {
        userId: hostId,
        name: hostRow?.user.name ?? null,
        image: hostRow?.user.image ?? null,
      });
    }
    return { live: true as const, hostId, seats: [...seats.values()] };
  }),

  signals: publicProcedure
    .input(scopeInput.extend({ take: z.number().int().min(1).max(80).optional() }))
    .query(async ({ ctx, input }) => {
      const rows = await liveDb(ctx.db).liveMessage.findMany({
        where: {
          scope: input.scope,
          scopeId: input.scopeId,
          body: { startsWith: LIVE_SIG },
        },
        orderBy: { createdAt: "desc" },
        take: input.take ?? 60,
        include: { user: { select: { id: true, name: true, image: true } } },
      });
      return rows
        .map((row) => ({
          id: row.id,
          userId: row.userId,
          createdAt: row.createdAt,
          signal: decodeSignal(row.body),
        }))
        .filter((row) => row.signal);
    }),

  signal: protectedProcedure
    .input(scopeInput.extend({ signal: signalInput }))
    .mutation(async ({ ctx, input }) => {
      return liveDb(ctx.db).liveMessage.create({
        data: {
          scope: input.scope,
          scopeId: input.scopeId,
          userId: ctx.session.user.id,
          body: encodeSignal(input.signal as LiveSignal),
        },
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

  edit: protectedProcedure
    .input(z.object({ id: z.string().min(1), body: z.string().trim().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await liveDb(ctx.db).liveMessage.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!existing || existing.body.startsWith(LIVE_SIG)) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return liveDb(ctx.db).liveMessage.update({
        where: { id: existing.id },
        data: { body: input.body },
      });
    }),

  unsend: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await liveDb(ctx.db).liveMessage.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!existing || existing.body.startsWith(LIVE_SIG)) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      await liveDb(ctx.db).liveMessage.delete({ where: { id: existing.id } });
      return { ok: true as const };
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
