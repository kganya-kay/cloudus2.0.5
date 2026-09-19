import type { PrismaClient } from "@prisma/client";

import { pickLiveMedia } from "~/lib/media-pulse/media";
import type { MediaPulseKindName } from "~/lib/media-pulse/kinds";
import { extractTopics, rankTopics, scoreStory, slugTopic } from "~/lib/media-pulse/topics";
import type { PulseStory } from "~/lib/media-pulse/types";

function story(input: {
  id: string;
  topic: string;
  kind: MediaPulseKindName;
  title: string;
  dek: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  extraImages?: Array<string | null | undefined>;
  interestCount?: number;
  score: number;
  shared?: boolean;
}): PulseStory | null {
  const media = pickLiveMedia(input);
  if (!media) return null;
  return {
    id: input.id,
    topic: input.topic || slugTopic(input.title) || "live",
    kind: input.kind,
    title: input.title,
    dek: input.dek || input.title,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    imageUrl: media.imageUrl ?? "",
    videoUrl: media.videoUrl,
    audioUrl: media.audioUrl,
    embedHtml: null,
    interestCount: input.interestCount ?? 1,
    score: input.score,
    shared: input.shared ?? false,
  };
}

function hoursSince(value?: Date | null) {
  if (!value) return 24;
  return Math.max(0, (Date.now() - value.getTime()) / 36e5);
}

export async function collectLiveStories(db: PrismaClient): Promise<PulseStory[]> {
  const [
    blogs,
    projects,
    shop,
    feed,
    events,
    rooms,
    creators,
    socials,
  ] = await Promise.all([
    db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      take: 40,
      orderBy: { publishedAt: "desc" },
      include: { blog: { select: { userName: true } } },
    }),
    db.project.findMany({
      where: { visibility: "PUBLIC", privacy: false },
      take: 40,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { likes: true, followers: true } } },
    }),
    db.shopItem.findMany({
      take: 40,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { orders: true, likes: true } } },
    }),
    db.feedPost.findMany({
      where: { visibility: "PUBLIC" },
      take: 40,
      orderBy: { publishedAt: "desc" },
      include: {
        media: true,
        creator: { select: { handle: true, displayName: true } },
      },
    }),
    db.event.findMany({
      take: 24,
      orderBy: { startAt: "desc" },
      include: { project: { select: { visibility: true, privacy: true } } },
    }),
    db.roomListing.findMany({
      where: { isActive: true, adminStatus: "APPROVED" },
      take: 24,
      orderBy: { updatedAt: "desc" },
      include: { media: true },
    }),
    db.creatorProfile.findMany({
      take: 24,
      orderBy: { updatedAt: "desc" },
    }),
    db.socialAccount.findMany({
      take: 40,
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const collected: PulseStory[] = [];

  for (const post of blogs) {
    const item = story({
      id: `blog-${post.id}`,
      topic: slugTopic(post.title),
      kind: post.videoUrl ? "VIDEO" : post.audioUrl ? "SONG" : "BLOG",
      title: post.title,
      dek: post.excerpt ?? post.title,
      sourceName: `@${post.blog.userName}`,
      sourceUrl: `/Blog/${post.blog.userName}/${post.slug}`,
      imageUrl: post.coverImage,
      videoUrl: post.videoUrl,
      audioUrl: post.audioUrl,
      score: 88 + (post.videoUrl || post.audioUrl ? 8 : 0),
    });
    if (item) collected.push(item);
  }

  for (const project of projects) {
    const item = story({
      id: `project-${project.id}`,
      topic: slugTopic(project.name),
      kind: project.heroVideo ? "VIDEO" : "CLIP",
      title: project.name,
      dek: project.description,
      sourceName: project.category ?? "Project",
      sourceUrl: `/projects/${project.id}`,
      imageUrl: project.image,
      videoUrl: project.heroVideo,
      interestCount: project._count.likes + project._count.followers,
      score:
        74 +
        (project.featured ? 16 : 0) +
        Math.min(project._count.likes + project._count.followers, 20),
    });
    if (item) collected.push(item);
  }

  const shopRanked = [...shop].sort(
    (a, b) => b._count.orders + b._count.likes - (a._count.orders + a._count.likes),
  );
  for (const item of shopRanked) {
    const next = story({
      id: `shop-${item.id}`,
      topic: slugTopic(item.name),
      kind: "POST",
      title: item.name,
      dek: item.description,
      sourceName: "Shop",
      sourceUrl: `/shop/${item.id}`,
      imageUrl: item.image,
      interestCount: item._count.orders,
      score: 80 + Math.min(item._count.orders * 4, 40) + Math.min(item._count.likes, 10),
    });
    if (next) collected.push(next);
  }

  for (const post of feed) {
    const firstMedia = post.media[0];
    const item = story({
      id: `feed-${post.id}`,
      topic: slugTopic(post.title ?? post.caption ?? post.creator.handle),
      kind: firstMedia?.type === "VIDEO" ? "VIDEO" : firstMedia?.type === "AUDIO" ? "SONG" : "POST",
      title: post.title ?? post.caption ?? post.creator.displayName,
      dek: post.caption ?? post.title ?? `@${post.creator.handle}`,
      sourceName: `@${post.creator.handle}`,
      sourceUrl: "/feed",
      imageUrl: post.coverImage,
      videoUrl: firstMedia?.type === "VIDEO" ? firstMedia.url : undefined,
      audioUrl: firstMedia?.type === "AUDIO" ? firstMedia.url : undefined,
      extraImages: [firstMedia?.type === "IMAGE" ? firstMedia.url : undefined],
      score: 70 + (post.isPinned ? 12 : 0),
    });
    if (item) collected.push(item);
  }

  for (const event of events) {
    if (event.project.visibility !== "PUBLIC" || event.project.privacy) continue;
    const item = story({
      id: `event-${event.id}`,
      topic: slugTopic(event.name),
      kind: event.streamUrl ? "LIVE" : "EVENT",
      title: event.name,
      dek: event.description ?? event.venue ?? event.location ?? event.name,
      sourceName: event.venue ?? "Event",
      sourceUrl: `/events/${event.id}`,
      imageUrl: event.coverImage,
      videoUrl: event.streamUrl,
      score: 66,
    });
    if (item) collected.push(item);
  }

  for (const room of rooms) {
    const video = room.media.find((item) => item.type === "VIDEO");
    const item = story({
      id: `room-${room.id}`,
      topic: slugTopic(room.title),
      kind: "PHOTO",
      title: room.title,
      dek: room.description,
      sourceName: "Rooms",
      sourceUrl: `/rooms/${room.id}`,
      imageUrl: room.coverImage,
      videoUrl: video?.url,
      extraImages: room.gallery,
      score: 62,
    });
    if (item) collected.push(item);
  }

  for (const creator of creators) {
    const item = story({
      id: `creator-${creator.id}`,
      topic: slugTopic(creator.displayName),
      kind: "PERSON",
      title: creator.displayName,
      dek: creator.tagline ?? creator.bio ?? creator.handle,
      sourceName: `@${creator.handle}`,
      sourceUrl: "/feed",
      imageUrl: creator.coverUrl ?? creator.avatarUrl,
      score: 52 + (creator.verified ? 10 : 0),
    });
    if (item) collected.push(item);
  }

  for (const account of socials) {
    const item = story({
      id: `social-${account.id}`,
      topic: slugTopic(account.handle),
      kind: account.latestVideoUrl ? "VIDEO" : account.latestAudioUrl ? "SONG" : "PHOTO",
      title: account.latestCaption ?? `@${account.handle}`,
      dek: account.latestCaption ?? account.handle,
      sourceName: account.user.name ?? `@${account.handle}`,
      sourceUrl: account.latestPostUrl ?? account.profileUrl,
      imageUrl: account.latestImageUrl,
      videoUrl: account.latestVideoUrl,
      audioUrl: account.latestAudioUrl,
      score: 58,
    });
    if (item) collected.push(item);
  }

  const seeds = collected.flatMap((item) =>
    extractTopics(`${item.title} ${item.dek}`, item.sourceName, item.kind),
  );
  const ranked = rankTopics(seeds);

  return collected
    .map((item) => {
      const topic = ranked.find((entry) => entry.topic === item.topic);
      return {
        ...item,
        shared: topic?.shared ?? item.shared,
        interestCount: Math.max(item.interestCount, topic?.uniqueUsers ?? 1),
        score:
          item.score +
          scoreStory({
            uniqueUsers: topic?.uniqueUsers ?? 1,
            mentions: topic?.mentions ?? 1,
            hasVideo: Boolean(item.videoUrl),
            hasAudio: Boolean(item.audioUrl),
            hasImage: Boolean(item.imageUrl),
            shared: topic?.shared ?? false,
            freshnessHours: hoursSince(),
          }) / 4,
      };
    })
    .sort((a, b) => b.score - a.score);
}
