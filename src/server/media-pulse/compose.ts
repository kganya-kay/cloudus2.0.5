import type { PrismaClient } from "@prisma/client";

import { EDITORIAL_WIRE, editorialAsStories } from "~/lib/media-pulse/catalog";
import type { MediaPulseKindName } from "~/lib/media-pulse/kinds";
import { fetchEasiestMedia, pickRichest } from "~/lib/media-pulse/sources";
import type { PulseFrontpage, PulseStory } from "~/lib/media-pulse/types";
import { extractTopics, rankTopics, scoreStory, type TopicSeed } from "~/lib/media-pulse/topics";
import { isDatabaseUnreachable } from "~/server/db-errors";

import { writeStoryDek } from "./write-dek";

const CACHE_MS = 45 * 60 * 1000;

function toStory(input: {
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
  interestCount: number;
  score: number;
  shared: boolean;
}): PulseStory {
  return {
    ...input,
    imageUrl: input.imageUrl ?? "/cloudus-logo-final.png",
    videoUrl: input.videoUrl ?? null,
    audioUrl: input.audioUrl ?? null,
    embedHtml: null,
  };
}

async function collectSeeds(db: PrismaClient): Promise<TopicSeed[]> {
  const [posts, projects, creators, interests, socials] = await Promise.all([
    db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      take: 40,
      select: { title: true, excerpt: true, authorId: true },
    }),
    db.project.findMany({
      where: { visibility: "PUBLIC" },
      take: 40,
      select: { name: true, category: true, tags: true, createdById: true },
    }),
    db.creatorProfile.findMany({
      take: 30,
      select: { skills: true, focusAreas: true, userId: true, displayName: true },
    }),
    db.topicInterest.findMany({
      take: 80,
      orderBy: { createdAt: "desc" },
      select: { topic: true, label: true, userId: true, source: true },
    }),
    db.socialAccount.findMany({
      take: 40,
      select: { handle: true, latestCaption: true, userId: true },
    }),
  ]);

  const seeds: TopicSeed[] = [];
  for (const post of posts) {
    seeds.push(...extractTopics(`${post.title} ${post.excerpt ?? ""}`, post.authorId, "BLOG"));
  }
  for (const project of projects) {
    seeds.push(...extractTopics(`${project.name} ${project.category ?? ""} ${project.tags.join(" ")}`, project.createdById, "PROJECT"));
  }
  for (const creator of creators) {
    seeds.push(...extractTopics(`${creator.displayName} ${creator.skills.join(" ")} ${creator.focusAreas.join(" ")}`, creator.userId, "CREATOR"));
  }
  for (const social of socials) {
    seeds.push(...extractTopics(`${social.handle} ${social.latestCaption ?? ""}`, social.userId, "SOCIAL"));
  }
  for (const interest of interests) {
    seeds.push({
      topic: interest.topic,
      label: interest.label,
      userId: interest.userId,
      source: interest.source,
    });
  }
  for (const item of EDITORIAL_WIRE) {
    seeds.push({ topic: item.topic, label: item.label, source: "WIRE", userId: `wire-${item.topic}` });
  }
  return seeds;
}

async function communityStories(db: PrismaClient, topic: string): Promise<PulseStory[]> {
  const needle = topic.replace(/-/g, " ");
  const posts = await db.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: needle, mode: "insensitive" } },
        { excerpt: { contains: needle, mode: "insensitive" } },
      ],
    },
    take: 2,
    include: { blog: { select: { userName: true } } },
  });

  return posts
    .filter((post) => post.coverImage || post.videoUrl || post.audioUrl)
    .map((post) =>
      toStory({
        id: `blog-${post.id}`,
        topic,
        kind: post.videoUrl ? "VIDEO" : post.audioUrl ? "SONG" : "BLOG",
        title: post.title,
        dek: post.excerpt ?? post.title,
        sourceName: `@${post.blog.userName}`,
        sourceUrl: `/Blog/${post.blog.userName}`,
        imageUrl: post.coverImage,
        videoUrl: post.videoUrl,
        audioUrl: post.audioUrl,
        interestCount: 2,
        score: 70,
        shared: true,
      }),
    );
}

export async function composeFrontpage(
  db: PrismaClient,
  filter?: MediaPulseKindName,
): Promise<PulseFrontpage> {
  const fallback = editorialAsStories();
  try {
    const seeds = await collectSeeds(db);
    const ranked = rankTopics(seeds).slice(0, 5);
    const composed: PulseStory[] = [];

    for (const topic of ranked) {
      const cached = await db.mediaPulseStory.findMany({
        where: { topic: topic.topic, expiresAt: { gt: new Date() } },
        orderBy: { score: "desc" },
        take: 2,
      });

      if (cached.length) {
        for (const item of cached) {
          composed.push(
            toStory({
              id: item.id,
              topic: item.topic,
              kind: item.kind,
              title: item.title,
              dek: item.dek,
              sourceName: item.sourceName,
              sourceUrl: item.sourceUrl,
              imageUrl: item.imageUrl,
              videoUrl: item.videoUrl,
              audioUrl: item.audioUrl,
              interestCount: Math.max(item.interestCount, topic.uniqueUsers),
              score: item.score,
              shared: topic.shared,
            }),
          );
        }
        continue;
      }

      const local = await communityStories(db, topic.topic).catch(() => []);
      const remote = composed.length < 2 ? await fetchEasiestMedia(topic.label) : [];
      const richest = pickRichest(remote);
      const editorial = EDITORIAL_WIRE.find((item) => item.topic === topic.topic);
      const base = richest
        ? {
            kind: richest.kind,
            title: richest.title,
            dek: richest.dek,
            sourceName: richest.sourceName,
            sourceUrl: richest.sourceUrl,
            imageUrl: richest.imageUrl,
            videoUrl: richest.videoUrl,
            audioUrl: richest.audioUrl,
          }
        : editorial
          ? {
              kind: editorial.kind,
              title: editorial.title,
              dek: editorial.dek,
              sourceName: editorial.sourceName,
              sourceUrl: editorial.sourceUrl,
              imageUrl: editorial.imageUrl,
              videoUrl: editorial.videoUrl,
              audioUrl: editorial.audioUrl,
            }
          : null;

      const picked = local[0] ?? (base
        ? toStory({
            id: `live-${topic.topic}`,
            topic: topic.topic,
            interestCount: Math.max(topic.uniqueUsers, topic.shared ? 2 : 1),
            score: scoreStory({
              uniqueUsers: topic.uniqueUsers,
              mentions: topic.mentions,
              hasVideo: Boolean(base.videoUrl),
              hasAudio: Boolean(base.audioUrl),
              hasImage: Boolean(base.imageUrl),
              shared: topic.shared,
              freshnessHours: 2,
            }),
            shared: topic.shared,
            ...base,
            dek:
              composed.length === 0
                ? await writeStoryDek({
                    title: base.title,
                    topic: topic.label,
                    sourceName: base.sourceName,
                    extract: base.dek,
                  })
                : base.dek,
          })
        : null);

      if (!picked) continue;
      composed.push(picked);

      await db.mediaPulseStory
        .upsert({
          where: {
            topic_kind_sourceUrl: {
              topic: picked.topic,
              kind: picked.kind,
              sourceUrl: picked.sourceUrl,
            },
          },
          update: {
            title: picked.title,
            dek: picked.dek,
            imageUrl: picked.imageUrl,
            videoUrl: picked.videoUrl,
            audioUrl: picked.audioUrl,
            interestCount: picked.interestCount,
            score: picked.score,
            fetchedAt: new Date(),
            expiresAt: new Date(Date.now() + CACHE_MS),
          },
          create: {
            topic: picked.topic,
            kind: picked.kind,
            title: picked.title,
            dek: picked.dek,
            sourceName: picked.sourceName,
            sourceUrl: picked.sourceUrl,
            imageUrl: picked.imageUrl,
            videoUrl: picked.videoUrl,
            audioUrl: picked.audioUrl,
            interestCount: picked.interestCount,
            score: picked.score,
            expiresAt: new Date(Date.now() + CACHE_MS),
          },
        })
        .catch(() => undefined);
    }

    const pool = [...composed, ...fallback];
    const unique = new Map<string, PulseStory>();
    for (const story of pool) {
      if (!unique.has(story.sourceUrl)) unique.set(story.sourceUrl, story);
    }
    let stories = [...unique.values()].sort((a, b) => b.score - a.score);
    if (filter) {
      const filtered = stories.filter((item) => item.kind === filter);
      if (filtered.length) stories = filtered;
    }
    if (!stories.length) stories = fallback;

    return {
      lead: stories[0]!,
      rail: stories.slice(1, 5),
      kinds: [...new Set(stories.map((item) => item.kind))],
    };
  } catch (error) {
    if (!isDatabaseUnreachable(error)) {
      console.error("media pulse compose", error);
    }
    const stories = filter ? fallback.filter((item) => item.kind === filter) : fallback;
    const safe = stories.length ? stories : fallback;
    return { lead: safe[0]!, rail: safe.slice(1, 5), kinds: [...new Set(safe.map((item) => item.kind))] };
  }
}
