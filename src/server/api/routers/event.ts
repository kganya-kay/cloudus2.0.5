import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { isSuperAdminEmail } from "~/server/auth/super-admin";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const canManageAllEvents = (ctx: {
  session?: { user?: { role: Role; email?: string | null } } | null;
}) => {
  const email = ctx.session?.user?.email ?? null;
  return ctx.session?.user?.role === Role.ADMIN || isSuperAdminEmail(email);
};

const eventIdParam = z.object({ id: z.number().int().positive() });

const createEventInput = z.object({
  name: z.string().min(2),
  description: z.string().max(4000).optional(),
  projectId: z.number().int().positive(),
  hostId: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  venue: z.string().max(200).optional(),
  streamUrl: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  status: z.string().max(60).optional(),
});

const updateEventInput = z.object({
  id: z.number().int().positive(),
  data: z
    .object({
      name: z.string().min(2).optional(),
      description: z.string().max(4000).optional(),
      hostId: z.string().min(1).optional(),
      startAt: z.coerce.date().optional(),
      endAt: z.coerce.date().optional(),
      location: z.string().max(200).optional(),
      venue: z.string().max(200).optional(),
      streamUrl: z.string().url().optional(),
      coverImage: z.string().url().optional(),
      status: z.string().max(60).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "No fields to update.",
    }),
});

const listInput = z
  .object({
    take: z.number().int().min(1).max(60).optional(),
    cursor: z.number().int().positive().optional(),
    projectId: z.number().int().positive().optional(),
  })
  .optional();

const chatListInput = z.object({
  eventId: z.number().int().positive(),
  take: z.number().int().min(1).max(50).optional(),
});

const chatCreateInput = z.object({
  eventId: z.number().int().positive(),
  message: z.string().min(1).max(2000),
});

export const eventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createEventInput)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { id: true, createdById: true },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }
      if (!canManageAllEvents(ctx) && project.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only create events for projects you own.",
        });
      }
      if (!canManageAllEvents(ctx) && input.hostId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can assign a different host.",
        });
      }
      return ctx.db.event.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          startAt: input.startAt,
          endAt: input.endAt ?? null,
          location: input.location ?? null,
          venue: input.venue ?? null,
          streamUrl: input.streamUrl ?? null,
          coverImage: input.coverImage ?? null,
          status: input.status ?? "Scheduled",
          project: { connect: { id: input.projectId } },
          host: { connect: { id: input.hostId } },
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  update: protectedProcedure
    .input(updateEventInput)
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        select: { id: true, createdById: true },
      });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
      }
      if (!canManageAllEvents(ctx) && event.createdById !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.event.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(eventIdParam)
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        select: { id: true, createdById: true },
      });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
      }
      if (!canManageAllEvents(ctx) && event.createdById !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await ctx.db.event.delete({ where: { id: input.id } });
      return { ok: true as const };
    }),

  list: publicProcedure.input(listInput).query(async ({ ctx, input }) => {
    const take = input?.take ?? 24;
    const rows = await ctx.db.event.findMany({
      where: input?.projectId ? { projectId: input.projectId } : undefined,
      take: take + 1,
      ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      orderBy: { startAt: "asc" },
      include: {
        project: { select: { id: true, name: true, image: true } },
        host: { select: { id: true, name: true, image: true } },
        _count: { select: { shopItems: true, chatPosts: true } },
      },
    });

    let nextCursor: number | undefined = undefined;
    if (rows.length > take) {
      const next = rows.pop()!;
      nextCursor = next.id;
    }

    const items = rows.map((row) => {
      const { _count, ...rest } = row;
      return {
        ...rest,
        shopItemCount: _count.shopItems,
        chatCount: _count.chatPosts,
      };
    });

    return { items, nextCursor };
  }),

  select: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              image: true,
              price: true,
              status: true,
              createdById: true,
              tags: true,
            },
          },
          host: { select: { id: true, name: true, image: true } },
          createdBy: { select: { id: true, name: true, image: true } },
          shopItems: {
            orderBy: { createdAt: "desc" },
            take: 6,
            select: { id: true, name: true, price: true, image: true, stock: true },
          },
          _count: { select: { shopItems: true, chatPosts: true } },
        },
      });
      if (!event) return null;
      const viewerId = ctx.session?.user?.id ?? null;
      return {
        ...event,
        viewerContext: {
          userId: viewerId,
          isOwner: viewerId ? event.createdById === viewerId : false,
          isHost: viewerId ? event.hostId === viewerId : false,
        },
      };
    }),

  listChat: publicProcedure.input(chatListInput).query(async ({ ctx, input }) => {
    const take = input.take ?? 30;
    return ctx.db.eventPost.findMany({
      where: { eventId: input.eventId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
      },
    });
  }),

  createChat: protectedProcedure
    .input(chatCreateInput)
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.eventId },
        select: { id: true, projectId: true },
      });
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found." });
      }
      return ctx.db.eventPost.create({
        data: {
          event: { connect: { id: input.eventId } },
          project: { connect: { id: event.projectId } },
          message: input.message,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
        },
      });
    }),
});
