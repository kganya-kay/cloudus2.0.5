import type { Prisma, PrismaClient, SocialMediaKind } from "@prisma/client";

import { fetchLatestSocialPost } from "~/lib/social/fetch-latest";
import type { SocialPlatformName } from "~/lib/social/platforms";

type Db = PrismaClient | Prisma.TransactionClient;

function asKind(value: SocialMediaKind) {
  return value;
}

export async function runSocialImportJob(db: Db, jobId: string) {
  const claimed = await db.socialImportJob.updateMany({
    where: { id: jobId, status: { in: ["QUEUED", "RUNNING"] } },
    data: { status: "RUNNING", startedAt: new Date(), error: null },
  });

  if (claimed.count === 0) {
    return db.socialImportJob.findUnique({ where: { id: jobId } });
  }

  const job = await db.socialImportJob.findUnique({
    where: { id: jobId },
    include: { account: true },
  });

  if (!job) return null;

  try {
    if (!job.account && !job.sourceUrl) {
      throw new Error("Connect one social account or paste a public post URL.");
    }

    const result = await fetchLatestSocialPost({
      platform: (job.account?.platform ?? "OTHER") as SocialPlatformName,
      handle: job.account?.handle ?? "profile",
      profileUrl: job.account?.profileUrl ?? job.sourceUrl ?? "",
      rssUrl: job.account?.rssUrl,
      seedPostUrl: job.sourceUrl ?? job.account?.seedPostUrl,
      latestPostUrl: job.account?.latestPostUrl,
      kind: asKind(job.requestedKind),
    });

    const finished = await db.socialImportJob.update({
      where: { id: job.id },
      data: {
        status: "READY",
        resultUrl: result.url,
        resultKind: result.kind,
        caption: result.caption,
        embedHtml: result.embedHtml,
        sourceUrl: result.postUrl ?? job.sourceUrl,
        finishedAt: new Date(),
        error: null,
      },
    });

    if (job.account) {
      await db.socialAccount.update({
        where: { id: job.account.id },
        data: {
          latestPostUrl: result.postUrl ?? job.account.latestPostUrl,
          latestCaption: result.caption ?? job.account.latestCaption,
          latestFetchedAt: new Date(),
          latestImageUrl: result.kind === "IMAGE" ? result.url : job.account.latestImageUrl,
          latestVideoUrl: result.kind === "VIDEO" ? result.url : job.account.latestVideoUrl,
          latestAudioUrl: result.kind === "AUDIO" ? result.url : job.account.latestAudioUrl,
          seedPostUrl: job.account.seedPostUrl ?? result.postUrl ?? job.sourceUrl,
        },
      });
    }

    return finished;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Social import failed.";
    return db.socialImportJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: message,
        finishedAt: new Date(),
      },
    });
  }
}
