import { extractOpenGraph, extractRssEntries, youtubeIdsInText } from "~/lib/social/extract";
import { youtubeIdFromUrl } from "~/lib/social/embed";

import { DAILY_DESK, DESK_CHANNELS, type DeskBeat } from "./catalog";
import type { MediaPulseKindName } from "./kinds";

const USER_AGENT = "CloudusMediaPulse/1.0 (+https://cloudus.app; public Wikipedia/iTunes/RSS only)";

export type FetchedMedia = {
  kind: MediaPulseKindName;
  title: string;
  dek: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
};

async function fetchText(url: string, timeoutMs = 6000) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json, application/xml, text/xml, text/html;q=0.8,*/*;q=0.5",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`fetch ${response.status}`);
  return response.text();
}

export async function fetchWikipedia(title: string): Promise<FetchedMedia | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const data = JSON.parse(await fetchText(url)) as {
      title?: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
      originalimage?: { source?: string };
      thumbnail?: { source?: string };
      type?: string;
    };
    const page = data.content_urls?.desktop?.page;
    const image = data.originalimage?.source ?? data.thumbnail?.source;
    if (!page || !data.title) return null;
    return {
      kind: data.type === "standard" && /singer|rapper|dj|producer|actor|player/i.test(data.extract ?? "") ? "PERSON" : "ARTICLE",
      title: data.title,
      dek: (data.extract ?? "").split(". ").slice(0, 2).join(". ").slice(0, 280),
      sourceName: "Wikipedia",
      sourceUrl: page,
      imageUrl: image,
    };
  } catch {
    return null;
  }
}

export async function fetchItunes(term: string): Promise<FetchedMedia | null> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=ZA&limit=3&media=music`;
    const data = JSON.parse(await fetchText(url)) as {
      results?: Array<{
        wrapperType?: string;
        kind?: string;
        trackName?: string;
        collectionName?: string;
        artistName?: string;
        previewUrl?: string;
        artworkUrl100?: string;
        artworkUrl600?: string;
        trackViewUrl?: string;
        collectionViewUrl?: string;
      }>;
    };
    const hit = data.results?.find((item) => item.previewUrl) ?? data.results?.[0];
    if (!hit) return null;
    const isVideo = hit.kind === "music-video";
    const isPodcast = hit.kind === "podcast" || hit.wrapperType === "audiobook";
    const art = (hit.artworkUrl600 ?? hit.artworkUrl100 ?? "").replace("100x100", "600x600");
    return {
      kind: isVideo ? "VIDEO" : isPodcast ? "PODCAST" : "SONG",
      title: hit.trackName ?? hit.collectionName ?? term,
      dek: `${hit.artistName ?? "Artist"} · ${hit.collectionName ?? "Single"}`,
      sourceName: "iTunes",
      sourceUrl: hit.trackViewUrl ?? hit.collectionViewUrl ?? `https://music.apple.com/search?term=${encodeURIComponent(term)}`,
      imageUrl: art || undefined,
      videoUrl: isVideo ? hit.previewUrl : undefined,
      audioUrl: !isVideo ? hit.previewUrl : undefined,
    };
  } catch {
    return null;
  }
}

export async function fetchYoutubeOembed(watchUrl: string): Promise<FetchedMedia | null> {
  try {
    const id = youtubeIdFromUrl(watchUrl);
    const url = id ? `https://www.youtube.com/watch?v=${id}` : watchUrl;
    const data = JSON.parse(
      await fetchText(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, 5000),
    ) as { title?: string; author_name?: string; thumbnail_url?: string };
    if (!data.title) return null;
    return {
      kind: "VIDEO",
      title: data.title,
      dek: data.author_name ?? "YouTube",
      sourceName: "YouTube",
      sourceUrl: url,
      imageUrl: data.thumbnail_url ?? (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined),
      videoUrl: url,
    };
  } catch {
    const id = youtubeIdFromUrl(watchUrl);
    if (!id) return null;
    return {
      kind: "VIDEO",
      title: "YouTube",
      dek: "YouTube",
      sourceName: "YouTube",
      sourceUrl: `https://www.youtube.com/watch?v=${id}`,
      imageUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      videoUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }
}

export function youtubeChannelFeed(channelId: string) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

export function isYoutubeShort(url?: string | null) {
  return Boolean(url?.includes("/shorts/"));
}

export async function fetchYoutubeChannel(
  channelId: string,
  take = 2,
  opts?: { skipShorts?: boolean; match?: string },
): Promise<FetchedMedia[]> {
  try {
    const xml = await fetchText(youtubeChannelFeed(channelId), 7000);
    const match = opts?.match ? new RegExp(opts.match, "i") : null;
    const entries = extractRssEntries(xml, 16)
      .filter((entry) => entry.title && (entry.video || entry.link))
      .filter((entry) => (opts?.skipShorts ? !isYoutubeShort(entry.link) : true))
      .filter((entry) => (match ? match.test(`${entry.title} ${entry.link ?? ""}`) : true))
      .slice(0, take);
    const rows = await Promise.all(
      entries.map((entry) => fetchYoutubeOembed(entry.video ?? entry.link ?? "")),
    );
    return rows.filter((item): item is FetchedMedia => Boolean(item));
  } catch {
    return [];
  }
}

export async function fetchRssFeed(url: string, limit = 3): Promise<FetchedMedia[]> {
  try {
    const xml = await fetchText(url, 7000);
    return extractRssEntries(xml, limit)
      .filter((entry) => entry.link && entry.title)
      .map((entry) => ({
        kind: (entry.video ? "VIDEO" : "ARTICLE") as MediaPulseKindName,
        title: entry.title!,
        dek: entry.title!,
        sourceName: new URL(url).hostname.replace(/^www\./, ""),
        sourceUrl: entry.link!,
        imageUrl: entry.image,
        videoUrl: entry.video,
        audioUrl: entry.audio,
      }));
  } catch {
    return [];
  }
}

export async function resolveYoutubeChannelId(input: string): Promise<string | null> {
  const raw = input.trim();
  const known = DESK_CHANNELS[raw.toLowerCase()];
  if (known) return known;
  const fromUrl = raw.match(/youtube\.com\/channel\/(UC[\w-]{22})/i)?.[1];
  if (fromUrl) return fromUrl;
  if (/^UC[\w-]{22}$/.test(raw)) return raw;
  const handle = raw.startsWith("@")
    ? raw
    : raw.match(/youtube\.com\/@([^/?#]+)/i)?.[1]
      ? `@${raw.match(/youtube\.com\/@([^/?#]+)/i)?.[1]}`
      : null;
  if (handle) {
    const mapped = DESK_CHANNELS[handle.toLowerCase()];
    if (mapped) return mapped;
    try {
      const html = await fetchText(`https://www.youtube.com/${handle}`, 7000);
      return html.match(/"channelId":"(UC[\w-]{22})"/)?.[1] ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

export function matchDeskBeat(note: string): DeskBeat | undefined {
  const q = note.trim().toLowerCase();
  if (!q) return undefined;
  return DAILY_DESK.find((beat) => {
    const hay = [beat.topic, beat.query, beat.handle ?? ""].join(" ").toLowerCase();
    return hay.includes(q) || q.includes(beat.topic) || q.includes(beat.query.toLowerCase());
  });
}

export async function collectBeat(beat: DeskBeat): Promise<FetchedMedia[]> {
  const take = beat.take ?? 1;
  if (beat.channelId) {
    const fromChannel = await fetchYoutubeChannel(beat.channelId, take, {
      skipShorts: beat.skipShorts,
      match: beat.match,
    });
    if (fromChannel.length) return fromChannel;
    if (beat.match) {
      const latest = await fetchYoutubeChannel(beat.channelId, take, { skipShorts: beat.skipShorts });
      if (latest.length) return latest;
    }
  }
  if (beat.rss) {
    const fromRss = await fetchRssFeed(beat.rss, take);
    if (fromRss.length) return fromRss;
  }
  if (beat.kind === "VIDEO") {
    const live = await fetchYouTube(beat.query);
    const fallback = !live && beat.youtube ? await fetchYoutubeOembed(beat.youtube) : null;
    return [live, fallback].filter((item): item is FetchedMedia => Boolean(item)).slice(0, take);
  }
  return fetchNewsMany(beat.query, take);
}

export async function resolveDeskNote(note: string): Promise<FetchedMedia[]> {
  const value = note.trim();
  if (!value) return [];

  const beat = matchDeskBeat(value);
  if (beat) return collectBeat(beat);

  if (/^https?:\/\//i.test(value)) {
    const channelId = await resolveYoutubeChannelId(value);
    if (channelId) return fetchYoutubeChannel(channelId, 2, { skipShorts: true });
    if (youtubeIdFromUrl(value) || /youtube\.com|youtu\.be/i.test(value)) {
      const video = await fetchYoutubeOembed(value);
      return video ? [video] : [];
    }
    if (/\.xml(\?|$)/i.test(value) || /rss|atom|feed/i.test(value)) {
      return fetchRssFeed(value, 3);
    }
    try {
      const html = await fetchText(value, 7000);
      const og = extractOpenGraph(html);
      if (og.title && (og.image || og.video || og.audio || og.url)) {
        return [
          {
            kind: og.video ? "VIDEO" : og.audio ? "PODCAST" : "ARTICLE",
            title: og.title,
            dek: og.description ?? og.title,
            sourceName: new URL(value).hostname.replace(/^www\./, ""),
            sourceUrl: og.url ?? value,
            imageUrl: og.image,
            videoUrl: og.video,
            audioUrl: og.audio,
          },
        ];
      }
    } catch {
      return [];
    }
    return [];
  }

  if (value.startsWith("@") || value.toLowerCase().includes("youtube.com/@")) {
    const channelId = await resolveYoutubeChannelId(value);
    if (channelId) return fetchYoutubeChannel(channelId, 2, { skipShorts: true });
  }

  const [video, news] = await Promise.all([fetchYouTube(value), fetchNewsMany(value, 2)]);
  return [video, ...news].filter((item): item is FetchedMedia => Boolean(item));
}

export async function fetchYouTube(term: string): Promise<FetchedMedia | null> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${term} site:youtube.com when:30d`)}&hl=en-ZA&gl=ZA&ceid=ZA:en`;
    const xml = await fetchText(url);
    const ids = youtubeIdsInText(xml);
    if (ids[0]) {
      return fetchYoutubeOembed(`https://www.youtube.com/watch?v=${ids[0]}`);
    }
    const entry = extractRssEntries(xml, 1)[0];
    if (entry?.link) {
      const fromLink = youtubeIdFromUrl(entry.link);
      if (fromLink) return fetchYoutubeOembed(`https://www.youtube.com/watch?v=${fromLink}`);
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchNewsMany(term: string, limit = 2): Promise<FetchedMedia[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${term} when:14d`)}&hl=en-ZA&gl=ZA&ceid=ZA:en`;
    const xml = await fetchText(url);
    return extractRssEntries(xml, limit)
      .filter((entry) => entry.link && entry.title)
      .map((entry) => ({
        kind: "ARTICLE" as const,
        title: entry.title!,
        dek: term,
        sourceName: "News",
        sourceUrl: entry.link!,
        imageUrl: entry.image,
        videoUrl: entry.video,
      }));
  } catch {
    return [];
  }
}

export async function fetchNews(term: string): Promise<FetchedMedia | null> {
  return (await fetchNewsMany(term, 1))[0] ?? null;
}

export async function fetchEasiestMedia(label: string): Promise<FetchedMedia[]> {
  const settled = await Promise.allSettled([
    fetchWikipedia(label),
    fetchItunes(label),
    fetchNews(label),
  ]);
  return settled
    .filter((item): item is PromiseFulfilledResult<FetchedMedia | null> => item.status === "fulfilled")
    .map((item) => item.value)
    .filter((item): item is FetchedMedia => Boolean(item?.sourceUrl && (item.imageUrl || item.videoUrl || item.audioUrl)));
}

export function pickRichest(items: FetchedMedia[]) {
  return [...items].sort((a, b) => {
    const score = (item: FetchedMedia) =>
      (item.videoUrl ? 8 : 0) + (item.audioUrl ? 5 : 0) + (item.imageUrl ? 3 : 0);
    return score(b) - score(a);
  })[0];
}
