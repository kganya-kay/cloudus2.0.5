import type { PrismaClient } from "@prisma/client";

import { LIVE_SIG } from "~/lib/live/signal";
import { roomHref, roomsFromSignals } from "~/lib/live/rooms";
import type { PulseStory } from "~/lib/media-pulse/types";

const LIVE_FLOOR = 10_000;

export async function collectOnAirStories(db: PrismaClient): Promise<PulseStory[]> {
  const [signals, liveEvents] = await Promise.all([
    db.liveMessage.findMany({
      where: { body: { startsWith: LIVE_SIG } },
      orderBy: { createdAt: "desc" },
      take: 400,
      include: { user: { select: { name: true, image: true } } },
    }),
    db.event.findMany({
      where: { status: "Live" },
      take: 12,
      orderBy: { updatedAt: "desc" },
      include: { host: { select: { name: true, image: true } } },
    }),
  ]);

  const rooms = roomsFromSignals(signals);
  const stories: PulseStory[] = rooms.map((room) => ({
    id: `onair-${room.scope}-${room.scopeId}`,
    topic: "live",
    kind: "LIVE",
    title: room.hostName ?? "Live",
    dek: `${room.viewers} in the room`,
    sourceName: "Live",
    sourceUrl: roomHref(room.scope, room.scopeId),
    imageUrl: room.hostImage ?? "",
    videoUrl: null,
    audioUrl: null,
    embedHtml: null,
    interestCount: room.viewers,
    score: LIVE_FLOOR + room.viewers * 100,
    shared: true,
    viewers: room.viewers,
  }));

  const seen = new Set(stories.map((item) => item.sourceUrl));
  for (const event of liveEvents) {
    const href = `/events/${event.id}`;
    if (seen.has(href)) {
      const existing = stories.find((item) => item.sourceUrl === href);
      if (existing) {
        existing.title = event.name;
        existing.imageUrl = event.coverImage ?? existing.imageUrl;
        existing.videoUrl = event.streamUrl ?? existing.videoUrl;
      }
      continue;
    }
    stories.push({
      id: `onair-event-${event.id}`,
      topic: "live",
      kind: "LIVE",
      title: event.name,
      dek: event.host.name ?? "Live",
      sourceName: "Live",
      sourceUrl: href,
      imageUrl: event.coverImage ?? event.host.image ?? "",
      videoUrl: event.streamUrl,
      audioUrl: null,
      embedHtml: null,
      interestCount: 1,
      score: LIVE_FLOOR + 50,
      shared: true,
      viewers: 1,
    });
  }

  return stories.sort((a, b) => (b.viewers ?? 0) - (a.viewers ?? 0) || b.score - a.score);
}
