import type { PrismaClient } from "@prisma/client";

import { editionBounds, pickLiveMedia } from "~/lib/media-pulse/media";
import type { MediaPulseKindName } from "~/lib/media-pulse/kinds";
import type { PulseFrontpage, PulseStory } from "~/lib/media-pulse/types";
import { isDatabaseUnreachable } from "~/server/db-errors";

import { collectLiveStories } from "./live";
import { collectOnAirStories } from "./on-air";
import { collectWireStories } from "./wire";

function fromRecord(item: {
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
}): PulseStory | null {
  const media = pickLiveMedia(item);
  if (!media) return null;
  return {
    id: item.id,
    topic: item.topic,
    kind: item.kind,
    title: item.title,
    dek: item.dek,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    imageUrl: media.imageUrl ?? "",
    videoUrl: media.videoUrl,
    audioUrl: media.audioUrl,
    embedHtml: null,
    interestCount: item.interestCount,
    score: item.score,
    shared: true,
  };
}

export async function composeFrontpage(db: PrismaClient): Promise<PulseFrontpage> {
  try {
    const { start, end } = editionBounds();
    const [adminRows, onAir, live, wire] = await Promise.all([
      db.mediaPulseStory.findMany({
        where: {
          origin: "ADMIN",
          OR: [{ pinned: true }, { editionDate: { gte: start, lt: end } }],
        },
        orderBy: [{ pinned: "desc" }, { score: "desc" }, { fetchedAt: "desc" }],
      }),
      collectOnAirStories(db).catch(() => [] as PulseStory[]),
      collectLiveStories(db),
      collectWireStories(),
    ]);

    const adminStories = adminRows
      .map((item) =>
        fromRecord({
          ...item,
          kind: item.kind,
          score: item.pinned ? item.score + 120 : item.score + 100,
        }),
      )
      .filter((item): item is PulseStory => Boolean(item));

    const unique = new Map<string, PulseStory>();
    for (const item of [...onAir, ...adminStories, ...wire, ...live]) {
      if (!unique.has(item.sourceUrl)) unique.set(item.sourceUrl, item);
    }

    const stories = [...unique.values()]
      .sort((a, b) => {
        const liveA = a.kind === "LIVE" ? 1 : 0;
        const liveB = b.kind === "LIVE" ? 1 : 0;
        if (liveA !== liveB) return liveB - liveA;
        if (liveA) return (b.viewers ?? 0) - (a.viewers ?? 0) || b.score - a.score;
        return b.score - a.score;
      })
      .slice(0, 15);
    return {
      stories,
      kinds: [...new Set(stories.map((item) => item.kind))],
    };
  } catch (error) {
    if (!isDatabaseUnreachable(error)) {
      console.error("media pulse compose", error);
    }
    return { stories: [], kinds: [] };
  }
}
