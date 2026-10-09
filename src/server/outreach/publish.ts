import { OutreachChannel, OutreachPostStatus, type PrismaClient } from "@prisma/client";

import { env } from "~/env";
import { composerUrl, type SocialChannel } from "~/lib/outreach/channels";

type Db = PrismaClient;

function token(name: string) {
  return process.env[name]?.trim() || "";
}

export function channelReady(channel: SocialChannel) {
  if (channel === "LINKEDIN") return Boolean(token("LINKEDIN_ACCESS_TOKEN"));
  if (channel === "FACEBOOK") {
    return Boolean(token("FACEBOOK_PAGE_ID") && token("FACEBOOK_PAGE_ACCESS_TOKEN"));
  }
  return Boolean(token("INSTAGRAM_BUSINESS_ID") && token("INSTAGRAM_ACCESS_TOKEN"));
}

async function postLinkedIn(body: string) {
  const access = token("LINKEDIN_ACCESS_TOKEN");
  const author = token("LINKEDIN_AUTHOR_URN");
  if (!access || !author) return { skipped: true as const, id: null as string | null };
  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: body },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  const json = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok) throw new Error(json.message ?? `LinkedIn ${response.status}`);
  return { skipped: false as const, id: json.id ?? null };
}

async function postFacebook(body: string) {
  const pageId = token("FACEBOOK_PAGE_ID");
  const access = token("FACEBOOK_PAGE_ACCESS_TOKEN");
  if (!pageId || !access) return { skipped: true as const, id: null as string | null };
  const url = new URL(`https://graph.facebook.com/v21.0/${pageId}/feed`);
  url.searchParams.set("message", body);
  url.searchParams.set("access_token", access);
  const response = await fetch(url, { method: "POST" });
  const json = (await response.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(json.error?.message ?? `Facebook ${response.status}`);
  return { skipped: false as const, id: json.id ?? null };
}

async function postInstagram(body: string, mediaUrl?: string | null) {
  const ig = token("INSTAGRAM_BUSINESS_ID");
  const access = token("INSTAGRAM_ACCESS_TOKEN");
  const image =
    mediaUrl ??
    `${env.AUTH_URL ?? "https://cloudusdigital.com"}/cloudus-logo-final.png`;
  if (!ig || !access) return { skipped: true as const, id: null as string | null };
  const create = new URL(`https://graph.facebook.com/v21.0/${ig}/media`);
  create.searchParams.set("image_url", image);
  create.searchParams.set("caption", body);
  create.searchParams.set("access_token", access);
  const container = await fetch(create, { method: "POST" });
  const created = (await container.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!container.ok || !created.id) {
    throw new Error(created.error?.message ?? `Instagram container ${container.status}`);
  }
  const publish = new URL(`https://graph.facebook.com/v21.0/${ig}/media_publish`);
  publish.searchParams.set("creation_id", created.id);
  publish.searchParams.set("access_token", access);
  const posted = await fetch(publish, { method: "POST" });
  const json = (await posted.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!posted.ok) throw new Error(json.error?.message ?? `Instagram ${posted.status}`);
  return { skipped: false as const, id: json.id ?? created.id };
}

export async function publishPost(db: Db, postId: string) {
  const post = await db.outreachPost.findUnique({ where: { id: postId } });
  if (!post) return null;
  if (post.status === OutreachPostStatus.POSTED) return post;

  await db.outreachPost.update({
    where: { id: post.id },
    data: { status: OutreachPostStatus.POSTING },
  });

  try {
    let result: { skipped: boolean; id: string | null } = { skipped: true, id: null };
    if (post.channel === OutreachChannel.LINKEDIN) result = await postLinkedIn(post.body);
    if (post.channel === OutreachChannel.FACEBOOK) result = await postFacebook(post.body);
    if (post.channel === OutreachChannel.INSTAGRAM) {
      result = await postInstagram(post.body, post.mediaUrl);
    }

    return db.outreachPost.update({
      where: { id: post.id },
      data: {
        status: result.skipped ? OutreachPostStatus.SKIPPED : OutreachPostStatus.POSTED,
        postedAt: result.skipped ? null : new Date(),
        externalId: result.id,
        error: result.skipped ? "Token missing — use composer" : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    return db.outreachPost.update({
      where: { id: post.id },
      data: { status: OutreachPostStatus.FAILED, error: message.slice(0, 500) },
    });
  }
}

export async function publishDue(db: Db, limit = 9) {
  const due = await db.outreachPost.findMany({
    where: {
      status: OutreachPostStatus.SCHEDULED,
      scheduledAt: { lte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });
  const results = [];
  for (const post of due) {
    results.push(await publishPost(db, post.id));
  }
  return results;
}

export function handoff(channel: SocialChannel, permalink: string) {
  return composerUrl(channel, permalink);
}
