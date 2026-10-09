import {
  OutreachChannel,
  OutreachPostStatus,
  Prisma,
  type PrismaClient,
} from "@prisma/client";

import { OUTREACH_CHANNELS, slotFor, type SocialChannel } from "~/lib/outreach/channels";
import { pulsePresence } from "~/server/revenue/engine";
import { craftChannelPost } from "./craft";
import { discoverForCampaign } from "./discover";
import { sendDueCampaignMail } from "./mail";
import { publishDue, publishPost } from "./publish";
import { ecosystemSnapshot } from "./snapshot";

type Db = PrismaClient;

function permalink() {
  return "/services";
}

export async function scheduleToday(db: Db, actorId?: string | null, force = false) {
  const snapshot = await ecosystemSnapshot(db);
  const created: string[] = [];

  for (const channel of OUTREACH_CHANNELS) {
    const scheduledAt = slotFor(channel);
    const existing = await db.outreachPost.findFirst({
      where: {
        channel,
        scheduledAt: {
          gte: new Date(Date.UTC(scheduledAt.getUTCFullYear(), scheduledAt.getUTCMonth(), scheduledAt.getUTCDate())),
          lt: new Date(Date.UTC(scheduledAt.getUTCFullYear(), scheduledAt.getUTCMonth(), scheduledAt.getUTCDate() + 1)),
        },
      },
    });
    if (existing && !force) continue;

    const body = await craftChannelPost(channel, snapshot, permalink());
    const post = await db.outreachPost.create({
      data: {
        channel,
        status: scheduledAt <= new Date() ? OutreachPostStatus.SCHEDULED : OutreachPostStatus.SCHEDULED,
        title: `${snapshot.service.name} · ${channel}`,
        body,
        permalink: permalink(),
        scheduledAt: scheduledAt <= new Date() ? new Date() : scheduledAt,
        context: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue,
        createdById: actorId ?? undefined,
      },
    });
    created.push(post.id);
    if (scheduledAt <= new Date() || force) {
      await publishPost(db, post.id);
    }
  }

  return { created, snapshot };
}

export async function runOrchestration(db: Db, actorId?: string | null) {
  const run = await db.orchestrationRun.create({ data: {} });
  const summary: {
    pulse?: unknown;
    schedule?: unknown;
    publish?: unknown;
    discover?: unknown;
    mail?: unknown;
    error?: unknown;
  } = {};
  try {
    summary.pulse = await pulsePresence(db);
    summary.schedule = await scheduleToday(db, actorId);
    summary.publish = (await publishDue(db)).length;

    const campaigns = await db.campaign.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
      take: 5,
    });
    const discovered = [];
    for (const campaign of campaigns) {
      discovered.push(await discoverForCampaign(db, campaign.id));
    }
    summary.discover = discovered;
    summary.mail = await sendDueCampaignMail(db);

    const payload = JSON.parse(JSON.stringify(summary)) as Prisma.InputJsonValue;
    await db.orchestrationRun.update({
      where: { id: run.id },
      data: { ok: true, finishedAt: new Date(), summary: payload },
    });
    return { id: run.id, ok: true, summary };
  } catch (error) {
    const message = error instanceof Error ? error.message : "orchestration failed";
    summary.error = message;
    const payload = JSON.parse(JSON.stringify(summary)) as Prisma.InputJsonValue;
    await db.orchestrationRun.update({
      where: { id: run.id },
      data: { ok: false, finishedAt: new Date(), summary: payload },
    });
    return { id: run.id, ok: false, summary };
  }
}

export async function fireDesk(db: Db, actorId: string, channels?: SocialChannel[]) {
  const snapshot = await ecosystemSnapshot(db);
  const picks = channels?.length ? channels : [...OUTREACH_CHANNELS];
  const posts = [];
  for (const channel of picks) {
    const body = await craftChannelPost(channel, snapshot, permalink());
    const post = await db.outreachPost.create({
      data: {
        channel: channel as OutreachChannel,
        status: OutreachPostStatus.SCHEDULED,
        title: `${snapshot.service.name} · ${channel}`,
        body,
        permalink: permalink(),
        scheduledAt: new Date(),
        context: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue,
        createdById: actorId,
      },
    });
    posts.push(await publishPost(db, post.id));
  }
  return { posts, snapshot };
}
