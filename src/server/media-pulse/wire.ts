import { DAILY_DESK } from "~/lib/media-pulse/catalog";
import { pickLiveMedia } from "~/lib/media-pulse/media";
import { collectBeat } from "~/lib/media-pulse/sources";
import type { PulseStory } from "~/lib/media-pulse/types";

const TTL_MS = 15 * 60 * 1000;
let cache: { at: number; stories: PulseStory[] } | null = null;

function toStory(
  id: string,
  topic: string,
  item: {
    kind: PulseStory["kind"];
    title: string;
    dek: string;
    sourceName: string;
    sourceUrl: string;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
  },
  score: number,
): PulseStory | null {
  const media = pickLiveMedia(item);
  if (!media) return null;
  return {
    id,
    topic,
    kind: item.videoUrl ? "VIDEO" : item.kind,
    title: item.title,
    dek: item.dek,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    imageUrl: media.imageUrl ?? "",
    videoUrl: media.videoUrl,
    audioUrl: media.audioUrl,
    embedHtml: null,
    interestCount: 3,
    score,
    shared: true,
  };
}

export function clearWireCache() {
  cache = null;
}

export async function collectWireStories(force = false): Promise<PulseStory[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.stories;

  const batches = await Promise.all(
    DAILY_DESK.map(async (seed, index) => {
      const take = seed.take ?? 1;
      const score = 130 - index * 3;
      const items = await collectBeat(seed);
      const collected: PulseStory[] = [];
      for (const [slot, item] of items.entries()) {
        const story = toStory(`wire-${seed.topic}-${slot}`, seed.topic, item, score + 8 - slot);
        if (story && !collected.some((row) => row.sourceUrl === story.sourceUrl)) {
          collected.push(story);
        }
      }
      return collected.slice(0, take);
    }),
  );

  const unique = new Map<string, PulseStory>();
  for (const story of batches.flat()) {
    if (!unique.has(story.sourceUrl)) unique.set(story.sourceUrl, story);
  }
  const stories = [...unique.values()].sort((a, b) => b.score - a.score).slice(0, 15);
  cache = { at: Date.now(), stories };
  return stories;
}
