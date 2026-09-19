import { SocialMediaKind, SocialPlatform } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { isDatabaseUnreachable } from "~/server/db-errors";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { runSocialImportJob } from "~/server/social/run-job";
import { resolveSocialIdentity, SOCIAL_PLATFORMS } from "~/lib/social/platforms";

const platformSchema = z.enum(SOCIAL_PLATFORMS);
const kindSchema = z.nativeEnum(SocialMediaKind);

const publicAccountSelect = {
  id: true,
  platform: true,
  handle: true,
  profileUrl: true,
  latestImageUrl: true,
  latestVideoUrl: true,
  latestAudioUrl: true,
  latestCaption: true,
  latestFetchedAt: true,
  isPrimary: true,
} as const;

async function getOwnedAccount(
  ctx: { db: typeof db; session: { user: { id: string } } },
  accountId?: string,
) {
  if (accountId) {
    const account = await ctx.db.socialAccount.findFirst({
      where: { id: accountId, userId: ctx.session.user.id },
    });
    if (!account) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Social account not found." });
    }
    return account;
  }

  return ctx.db.socialAccount.findFirst({
    where: { userId: ctx.session.user.id },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
  });
}

export const socialRouter = createTRPCRouter({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    try {
      return ctx.db.socialAccount.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      });
    } catch (error) {
      if (isDatabaseUnreachable(error)) return [];
      throw error;
    }
  }),

  listPublicByUserName: publicProcedure
    .input(z.object({ userName: z.string().trim().min(1).max(64) }))
    .query(async ({ ctx, input }) => {
      const userName = input.userName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const blog = await ctx.db.blog.findUnique({
        where: { userName },
        select: { ownerId: true },
      });
      if (!blog) return [];
      return ctx.db.socialAccount.findMany({
        where: { userId: blog.ownerId },
        select: publicAccountSelect,
        orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
      });
    }),

  upsertAccount: protectedProcedure
    .input(
      z.object({
        platform: platformSchema.optional(),
        handle: z.string().trim().max(80).optional(),
        profileUrl: z.string().trim().max(2048).optional(),
        rssUrl: z.string().url().max(2048).optional(),
        seedPostUrl: z.string().url().max(2048).optional(),
        makePrimary: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const identity = resolveSocialIdentity({
        platform: input.platform,
        handle: input.handle,
        profileUrl: input.profileUrl,
      });

      const existingCount = await ctx.db.socialAccount.count({
        where: { userId: ctx.session.user.id },
      });

      const account = await ctx.db.socialAccount.upsert({
        where: {
          userId_platform: {
            userId: ctx.session.user.id,
            platform: identity.platform as SocialPlatform,
          },
        },
        update: {
          handle: identity.handle,
          profileUrl: identity.profileUrl,
          rssUrl: input.rssUrl,
          seedPostUrl: input.seedPostUrl,
          isPrimary: input.makePrimary || existingCount === 0,
        },
        create: {
          userId: ctx.session.user.id,
          platform: identity.platform as SocialPlatform,
          handle: identity.handle,
          profileUrl: identity.profileUrl,
          rssUrl: input.rssUrl,
          seedPostUrl: input.seedPostUrl,
          isPrimary: existingCount === 0 || Boolean(input.makePrimary),
        },
      });

      if (account.isPrimary) {
        await ctx.db.socialAccount.updateMany({
          where: { userId: ctx.session.user.id, id: { not: account.id } },
          data: { isPrimary: false },
        });
      }

      return account;
    }),

  removeAccount: protectedProcedure
    .input(z.object({ accountId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await getOwnedAccount(ctx, input.accountId);
      await ctx.db.socialAccount.delete({ where: { id: input.accountId } });
      return { success: true as const };
    }),

  requestLatest: protectedProcedure
    .input(
      z.object({
        accountId: z.string().cuid().optional(),
        kind: kindSchema.optional(),
        sourceUrl: z.string().url().max(2048).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await getOwnedAccount(ctx, input.accountId);
      if (!account && !input.sourceUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Connect one social account first, or paste a public post URL.",
        });
      }

      if (account && input.sourceUrl) {
        await ctx.db.socialAccount.update({
          where: { id: account.id },
          data: { seedPostUrl: account.seedPostUrl ?? input.sourceUrl },
        });
      }

      const job = await ctx.db.socialImportJob.create({
        data: {
          userId: ctx.session.user.id,
          accountId: account?.id,
          requestedKind: input.kind ?? "IMAGE",
          sourceUrl: input.sourceUrl,
          status: "QUEUED",
        },
      });

      return (await runSocialImportJob(ctx.db, job.id)) ?? job;
    }),

  getJob: protectedProcedure
    .input(z.object({ jobId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const job = await ctx.db.socialImportJob.findFirst({
        where: { id: input.jobId, userId: ctx.session.user.id },
      });
      if (!job) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Import job not found." });
      }
      if (job.status === "QUEUED" || job.status === "RUNNING") {
        return (await runSocialImportJob(ctx.db, job.id)) ?? job;
      }
      return job;
    }),
});
