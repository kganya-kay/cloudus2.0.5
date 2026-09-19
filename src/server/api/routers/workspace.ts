import { FulfilmentStatus, Role, RoomAdminStatus } from "@prisma/client";
import { z } from "zod";

import { isSuperAdminEmail } from "~/server/auth/super-admin";
import { isDatabaseUnreachable } from "~/server/db-errors";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const captureKind = z.enum(["NOTE", "IDEA", "TASK"]);

const canSeeFounder = (email: string | null | undefined, role?: Role) =>
  role === Role.ADMIN || role === Role.CARETAKER || isSuperAdminEmail(email);

export const workspaceRouter = createTRPCRouter({
  overview: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user.id ?? null;
    const empty = {
      signedIn: Boolean(userId),
      projects: [],
      events: [],
      feed: [],
      shop: [],
      rooms: [],
      creators: [],
      announcements: [],
      blogs: [],
      captures: [],
      assignedTasks: [],
      nextBuildNight: null,
    };

    try {
    const [
      projects,
      events,
      feed,
      shop,
      rooms,
      creators,
      announcements,
      blogs,
      captures,
      assignedTasks,
    ] = await Promise.all([
      ctx.db.project.findMany({
        where: { visibility: "PUBLIC" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          status: true,
          type: true,
          category: true,
          price: true,
          createdAt: true,
          createdBy: { select: { id: true, name: true, image: true } },
        },
      }),
      ctx.db.event.findMany({
        where: { startAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 6) } },
        orderBy: { startAt: "asc" },
        take: 6,
        select: {
          id: true,
          name: true,
          description: true,
          startAt: true,
          location: true,
          venue: true,
          coverImage: true,
          status: true,
          host: { select: { name: true, image: true } },
        },
      }),
      ctx.db.feedPost.findMany({
        orderBy: { publishedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          caption: true,
          type: true,
          coverImage: true,
          publishedAt: true,
          creator: {
            select: {
              displayName: true,
              handle: true,
              avatarUrl: true,
              user: { select: { image: true, name: true } },
            },
          },
        },
      }),
      ctx.db.shopItem.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          price: true,
          image: true,
        },
      }),
      ctx.db.roomListing.findMany({
        where: { adminStatus: RoomAdminStatus.APPROVED, isActive: true },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: {
          id: true,
          title: true,
          coverImage: true,
          nightlyRateCents: true,
          address: { select: { city: true } },
        },
      }),
      ctx.db.creatorProfile.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          handle: true,
          displayName: true,
          tagline: true,
          avatarUrl: true,
          skills: true,
          tier: true,
          user: { select: { image: true } },
        },
      }),
      ctx.db.adminAnnouncement.findMany({
        orderBy: { publishedAt: "desc" },
        take: 3,
      }),
      ctx.db.blogPost.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          publishedAt: true,
          blog: { select: { userName: true, title: true } },
        },
      }),
      userId
        ? ctx.db.post.findMany({
            where: {
              createdById: userId,
              name: { startsWith: "[" },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
      userId
        ? ctx.db.projectTask.findMany({
            where: {
              assignedToId: userId,
              status: { in: ["BACKLOG", "IN_PROGRESS", "SUBMITTED"] },
            },
            orderBy: { updatedAt: "desc" },
            take: 6,
            select: {
              id: true,
              title: true,
              status: true,
              budgetCents: true,
              project: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    return {
      signedIn: Boolean(userId),
      projects,
      events,
      feed,
      shop,
      rooms,
      creators,
      announcements,
      blogs,
      captures,
      assignedTasks,
      nextBuildNight: events[0] ?? null,
    };
    } catch (error) {
      if (isDatabaseUnreachable(error)) {
        return empty;
      }
      throw error;
    }
  }),

  captures: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.post.findMany({
      where: {
        createdById: ctx.session.user.id,
        name: { startsWith: "[" },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
  }),

  capture: protectedProcedure
    .input(
      z.object({
        kind: captureKind,
        text: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          name: `[${input.kind}] ${input.text}`,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  founderSnapshot: protectedProcedure.query(async ({ ctx }) => {
    if (!canSeeFounder(ctx.session.user.email, ctx.session.user.role)) {
      return { allowed: false as const };
    }

    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);

    const [
      dailyOrders,
      openOrders,
      closedOrders,
      totalUsers,
      creators,
      publicProjects,
      publishedPosts,
      shopItems,
      upcomingEvents,
    ] = await Promise.all([
      ctx.db.order.count({ where: { createdAt: { gte: startToday } } }),
      ctx.db.order.count({
        where: { status: { notIn: [FulfilmentStatus.CLOSED, FulfilmentStatus.CANCELED] } },
      }),
      ctx.db.order.count({ where: { status: FulfilmentStatus.CLOSED } }),
      ctx.db.user.count(),
      ctx.db.creatorProfile.count(),
      ctx.db.project.count({ where: { visibility: "PUBLIC" } }),
      ctx.db.blogPost.count({ where: { status: "PUBLISHED" } }),
      ctx.db.shopItem.count(),
      ctx.db.event.count({ where: { startAt: { gte: now } } }),
    ]);

    return {
      allowed: true as const,
      dailyOrders,
      openOrders,
      closedOrders,
      totalUsers,
      creators,
      publicProjects,
      publishedPosts,
      shopItems,
      upcomingEvents,
    };
  }),
});
