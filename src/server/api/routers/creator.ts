import { CreatorTier } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const upsertProfileInput = z.object({
  handle: z.string().min(3).max(32).regex(/^[a-z0-9\-_]+$/i, "Use letters, numbers, - or _."),
  displayName: z.string().min(1).max(80),
  bio: z.string().max(500).optional(),
  tagline: z.string().max(120).optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  socialLinks: z.array(z.string().url()).max(8).optional(),
  skills: z.array(z.string()).max(20).optional(),
  focusAreas: z.array(z.string()).max(20).optional(),
  tier: z.nativeEnum(CreatorTier).optional(),
});

const profileHandleInput = z.object({ handle: z.string().min(1) });

export const creatorRouter = createTRPCRouter({
  upsertProfile: protectedProcedure
    .input(upsertProfileInput)
    .mutation(async ({ ctx, input }) => {
      const normalizedHandle = input.handle.toLowerCase();
      const existing = await ctx.db.creatorProfile.findUnique({
        where: { handle: normalizedHandle },
        select: { id: true, userId: true },
      });
      if (existing && existing.userId !== ctx.session.user.id) {
        throw new Error("Handle already taken.");
      }

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { isCreator: true },
      });

      const profile = await ctx.db.creatorProfile.upsert({
        where: { userId: ctx.session.user.id },
        update: {
          handle: normalizedHandle,
          displayName: input.displayName,
          bio: input.bio,
          tagline: input.tagline,
          avatarUrl: input.avatarUrl,
          coverUrl: input.coverUrl,
          website: input.website,
          socialLinks: input.socialLinks ?? [],
          skills: input.skills ?? [],
          focusAreas: input.focusAreas ?? [],
          tier: input.tier ?? CreatorTier.SEED,
        },
        create: {
          userId: ctx.session.user.id,
          handle: normalizedHandle,
          displayName: input.displayName,
          bio: input.bio,
          tagline: input.tagline,
          avatarUrl: input.avatarUrl,
          coverUrl: input.coverUrl,
          website: input.website,
          socialLinks: input.socialLinks ?? [],
          skills: input.skills ?? [],
          focusAreas: input.focusAreas ?? [],
          tier: input.tier ?? CreatorTier.SEED,
        },
      });

      await ctx.db.creatorEarning.upsert({
        where: { userId: ctx.session.user.id },
        update: {},
        create: { userId: ctx.session.user.id },
      });

      return profile;
    }),

  profileByHandle: publicProcedure
    .input(profileHandleInput)
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.creatorProfile.findUnique({
        where: { handle: input.handle.toLowerCase() },
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { followers: true, following: true, feedPosts: true } },
        },
      });
      return profile;
    }),

  featured: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.creatorProfile.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.creatorProfile.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { followers: true, following: true, feedPosts: true } },
      },
    });
    const earnings = await ctx.db.creatorEarning.findUnique({
      where: { userId: ctx.session.user.id },
    });
    return { profile, earnings };
  }),
});
