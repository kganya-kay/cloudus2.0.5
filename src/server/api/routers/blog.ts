import { BlogPostStatus, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const userNameSchema = z.string().trim().min(1).max(64);

const normalizeUserName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const defaultUserNameFromSession = (sessionUser: {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}) => {
  const byName = sessionUser.name ? normalizeUserName(sessionUser.name) : "";
  if (byName) return byName;
  const byEmail = sessionUser.email ? normalizeUserName(sessionUser.email.split("@")[0] ?? "") : "";
  if (byEmail) return byEmail;
  return normalizeUserName(sessionUser.id ?? "author");
};

const defaultBlogTitleFromSession = (sessionUser: { name?: string | null }, fallbackUserName: string) =>
  `${sessionUser.name?.trim() || fallbackUserName}'s Blog`;

const assertNormalized = (value: string) => {
  if (!value) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Username must contain at least one letter or number.",
    });
  }
  return value;
};

async function buildUniqueSlug(
  db: PrismaClient,
  blogId: string,
  requested: string,
  ignorePostId?: string,
) {
  const base = slugify(requested) || "post";
  let candidate = base;
  let counter = 2;

  while (true) {
    const existing = await db.blogPost.findUnique({
      where: { blogId_slug: { blogId, slug: candidate } },
      select: { id: true },
    });
    if (!existing || existing.id === ignorePostId) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

export const blogRouter = createTRPCRouter({
  profile: publicProcedure
    .input(
      z.object({
        userName: userNameSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const normalizedUserName = assertNormalized(normalizeUserName(input.userName));
      const blog = await ctx.db.blog.findUnique({
        where: { userName: normalizedUserName },
        select: {
          id: true,
          userName: true,
          title: true,
          description: true,
          ownerId: true,
          owner: { select: { id: true, name: true, image: true } },
          _count: { select: { posts: true } },
        },
      });

      if (!blog) return { blog: null, viewerCanManage: false };

      const viewerCanManage = ctx.session?.user?.id === blog.ownerId;
      return {
        blog: {
          id: blog.id,
          userName: blog.userName,
          title: blog.title,
          description: blog.description,
          postCount: blog._count.posts,
          owner: blog.owner,
        },
        viewerCanManage,
      };
    }),

  listPosts: publicProcedure
    .input(
      z.object({
        userName: userNameSchema,
        cursor: z.string().cuid().optional(),
        limit: z.number().int().positive().max(50).optional(),
        includeDrafts: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const normalizedUserName = assertNormalized(normalizeUserName(input.userName));
      const limit = input.limit ?? 20;

      const blog = await ctx.db.blog.findUnique({
        where: { userName: normalizedUserName },
        select: { id: true, ownerId: true },
      });

      if (!blog) {
        return { items: [], nextCursor: undefined as string | undefined };
      }

      const viewerCanManage = ctx.session?.user?.id === blog.ownerId;
      const shouldIncludeDrafts = Boolean(input.includeDrafts && viewerCanManage);

      const where = shouldIncludeDrafts
        ? { blogId: blog.id }
        : { blogId: blog.id, status: BlogPostStatus.PUBLISHED };

      const rows = await ctx.db.blogPost.findMany({
        where,
        take: limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (rows.length > limit) {
        const next = rows.pop();
        nextCursor = next?.id;
      }

      return { items: rows, nextCursor };
    }),

  getPostBySlug: publicProcedure
    .input(
      z.object({
        userName: userNameSchema,
        slug: z.string().trim().min(1).max(160),
        includeDraft: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const normalizedUserName = assertNormalized(normalizeUserName(input.userName));
      const normalizedSlug = slugify(input.slug);

      const blog = await ctx.db.blog.findUnique({
        where: { userName: normalizedUserName },
        select: { id: true, ownerId: true, userName: true, title: true },
      });
      if (!blog) return null;

      const viewerCanManage = ctx.session?.user?.id === blog.ownerId;
      const includeDraft = Boolean(input.includeDraft && viewerCanManage);

      const post = await ctx.db.blogPost.findUnique({
        where: {
          blogId_slug: {
            blogId: blog.id,
            slug: normalizedSlug,
          },
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      });

      if (!post) return null;
      if (!includeDraft && post.status !== BlogPostStatus.PUBLISHED) return null;

      return { blog: { userName: blog.userName, title: blog.title }, post, viewerCanManage };
    }),

  ensureMine: protectedProcedure.query(async ({ ctx }) => {
    const normalizedUserName = assertNormalized(defaultUserNameFromSession(ctx.session.user));
    const existingByUserName = await ctx.db.blog.findUnique({
      where: { userName: normalizedUserName },
      select: { ownerId: true },
    });

    if (existingByUserName && existingByUserName.ownerId !== ctx.session.user.id) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "The generated username is already taken by another blog owner.",
      });
    }

    return ctx.db.blog.upsert({
      where: { ownerId: ctx.session.user.id },
      update: {
        userName: normalizedUserName,
        title: defaultBlogTitleFromSession(ctx.session.user, normalizedUserName),
      },
      create: {
        ownerId: ctx.session.user.id,
        userName: normalizedUserName,
        title: defaultBlogTitleFromSession(ctx.session.user, normalizedUserName),
      },
    });
  }),

  createPost: protectedProcedure
    .input(
      z.object({
        userName: userNameSchema,
        title: z.string().trim().min(3).max(160),
        content: z.string().trim().min(1).max(50000),
        excerpt: z.string().trim().max(320).optional(),
        coverImage: z.string().url().max(2048).optional(),
        slug: z.string().trim().max(160).optional(),
        status: z.nativeEnum(BlogPostStatus).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedUserName = assertNormalized(normalizeUserName(input.userName));
      const existingByUserName = await ctx.db.blog.findUnique({
        where: { userName: normalizedUserName },
        select: { ownerId: true },
      });

      if (existingByUserName && existingByUserName.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot publish to another user's blog.",
        });
      }

      const blog = await ctx.db.blog.upsert({
        where: { ownerId: ctx.session.user.id },
        update: {
          userName: normalizedUserName,
          title: defaultBlogTitleFromSession(ctx.session.user, normalizedUserName),
        },
        create: {
          ownerId: ctx.session.user.id,
          userName: normalizedUserName,
          title: defaultBlogTitleFromSession(ctx.session.user, normalizedUserName),
        },
      });

      const status = input.status ?? BlogPostStatus.DRAFT;
      const slug = await buildUniqueSlug(ctx.db, blog.id, input.slug ?? input.title);

      return ctx.db.blogPost.create({
        data: {
          blogId: blog.id,
          authorId: ctx.session.user.id,
          slug,
          title: input.title,
          content: input.content,
          excerpt: input.excerpt,
          coverImage: input.coverImage,
          status,
          publishedAt: status === BlogPostStatus.PUBLISHED ? new Date() : null,
        },
      });
    }),

  updatePost: protectedProcedure
    .input(
      z.object({
        postId: z.string().cuid(),
        title: z.string().trim().min(3).max(160).optional(),
        content: z.string().trim().min(1).max(50000).optional(),
        excerpt: z.string().trim().max(320).optional(),
        coverImage: z.string().url().max(2048).nullable().optional(),
        slug: z.string().trim().max(160).optional(),
        status: z.nativeEnum(BlogPostStatus).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.blogPost.findUnique({
        where: { id: input.postId },
        include: { blog: { select: { id: true, ownerId: true } } },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Blog post not found." });
      }
      if (existing.blog.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed to edit this post." });
      }

      const nextStatus = input.status ?? existing.status;
      const nextPublishedAt =
        nextStatus === BlogPostStatus.PUBLISHED
          ? (existing.publishedAt ?? new Date())
          : null;

      const nextSlug = input.slug
        ? await buildUniqueSlug(ctx.db, existing.blog.id, input.slug, existing.id)
        : existing.slug;

      return ctx.db.blogPost.update({
        where: { id: existing.id },
        data: {
          title: input.title ?? existing.title,
          content: input.content ?? existing.content,
          excerpt: input.excerpt ?? existing.excerpt,
          coverImage: input.coverImage === undefined ? existing.coverImage : input.coverImage,
          slug: nextSlug,
          status: nextStatus,
          publishedAt: nextPublishedAt,
        },
      });
    }),

  deletePost: protectedProcedure
    .input(
      z.object({
        postId: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.blogPost.findUnique({
        where: { id: input.postId },
        include: { blog: { select: { ownerId: true } } },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Blog post not found." });
      }
      if (existing.blog.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed to delete this post." });
      }

      await ctx.db.blogPost.delete({ where: { id: input.postId } });
      return { success: true as const };
    }),
});
