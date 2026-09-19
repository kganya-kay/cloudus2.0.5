import { extractRssEntries, youtubeIdsInText } from "~/lib/social/extract";
import { youtubeIdFromUrl } from "~/lib/social/embed";

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
