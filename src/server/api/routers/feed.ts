import { FeedPostType } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const mediaInput = z.object({
  url: z.string().url(),
  type: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const publishInput = z.object({
  type: z.nativeEnum(FeedPostType).default(FeedPostType.PROJECT_UPDATE),
  title: z.string().max(120).optional(),
  caption: z.string().max(2000).optional(),
  tags: z.array(z.string()).max(20).optional(),
  coverImage: z.string().url().optional(),
  visibility: z.string().optional(),
  projectId: z.number().int().positive().optional(),
  shopItemId: z.number().int().positive().optional(),
  orderId: z.number().int().positive().optional(),
  isPinned: z.boolean().optional(),
  media: z.array(mediaInput).optional(),
});

const listInput = z
  .object({
    cursor: z.string().cuid().optional(),
    limit: z.number().int().positive().max(50).optional(),
  })
  .optional();

const reactionInput = z.object({
  postId: z.string().cuid(),
  type: z.string().default("LIKE"),
});

export const feedRouter = createTRPCRouter({
  publish: protectedProcedure
    .input(publishInput)
    .mutation(async ({ ctx, input }) => {
      const userHandleSource: string =
        ctx.session.user.email ?? ctx.session.user.id ?? "creator";
      const derivedHandle: string =
        userHandleSource.toLowerCase().split("@")[0] || "creator";
      const profile = await ctx.db.creatorProfile.upsert({
        where: { userId: ctx.session.user.id },
        update: {},
        create: {
          userId: ctx.session.user.id,
          handle: derivedHandle,
          displayName: ctx.session.user.name ?? "Cloudus Creator",
        },
      });

      const post = await ctx.db.feedPost.create({
        data: {
          creatorId: profile.id,
          projectId: input.projectId ?? null,
          shopItemId: input.shopItemId ?? null,
          orderId: input.orderId ?? null,
          type: input.type,
          title: input.title ?? null,
          caption: input.caption ?? null,
          tags: input.tags ?? [],
          coverImage: input.coverImage ?? null,
          visibility: input.visibility ?? "PUBLIC",
          isPinned: input.isPinned ?? false,
          media: input.media?.length
            ? {
                create: input.media.map((item) => ({
                  url: item.url,
                  type: item.type ?? "IMAGE",
                  metadata: item.metadata ?? undefined,
                })),
              }
            : undefined,
        },
        include: {
          media: true,
        },
      });

      return post;
    }),

  list: publicProcedure.input(listInput).query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 20;
    const posts = await ctx.db.feedPost.findMany({
      orderBy: { publishedAt: "desc" },
      take: limit + 1,
      cursor: input?.cursor ? { id: input.cursor } : undefined,
      include: {
        creator: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        media: true,
        project: { select: { id: true, name: true, image: true, status: true } },
        shopItem: { select: { id: true, name: true, price: true, image: true } },
      },
    });
    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
      const nextPost = posts.pop();
      nextCursor = nextPost?.id;
    }
    return { items: posts, nextCursor };
  }),

  react: protectedProcedure
    .input(reactionInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.feedReaction.findUnique({
        where: {
          postId_userId_type: {
            postId: input.postId,
            userId: ctx.session.user.id,
            type: input.type,
          },
        },
      });
      if (existing) {
        await ctx.db.feedReaction.delete({ where: { id: existing.id } });
        return { removed: true as const };
      }
      await ctx.db.feedReaction.create({
        data: {
          postId: input.postId,
          userId: ctx.session.user.id,
          type: input.type,
        },
      });
      return { removed: false as const };
    }),
});
