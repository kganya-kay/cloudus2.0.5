import type { SocialMediaKindName } from "./platforms";

export type OpenGraphMedia = {
  title?: string;
  description?: string;
  image?: string;
  video?: string;
  audio?: string;
  url?: string;
};

export type OEmbedPayload = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
  url?: string;
  type?: string;
};

export type ParsedRssEntry = {
  title?: string;
  link?: string;
  image?: string;
  video?: string;
  audio?: string;
};

const META_TAG = /<meta\b[^>]*>/gi;
const ATTR = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function attributesOf(tag: string) {
  const attrs: Record<string, string> = {};
  ATTR.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR.exec(tag))) {
    attrs[match[1]!.toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attrs;
}

export function extractOpenGraph(html: string): OpenGraphMedia {
  const media: OpenGraphMedia = {};
  const tags = html.match(META_TAG) ?? [];

  for (const tag of tags) {
    const attrs = attributesOf(tag);
    const key = (attrs.property ?? attrs.name ?? "").toLowerCase();
    const content = attrs.content?.trim();
    if (!key || !content) continue;
    if (key === "og:title" || key === "twitter:title") media.title ??= content;
    if (key === "og:description" || key === "twitter:description") media.description ??= content;
    if (key === "og:image" || key === "og:image:url" || key === "twitter:image") media.image ??= content;
    if (key === "og:video" || key === "og:video:url" || key === "twitter:player:stream") media.video ??= content;
    if (key === "og:audio" || key === "og:audio:url") media.audio ??= content;
    if (key === "og:url") media.url ??= content;
  }

  return media;
}

export function extractRssAlternate(html: string) {
  const match = html.match(
    /<link[^>]+type=["']application\/rss\+xml["'][^>]+href=["']([^"']+)["'][^>]*>/i,
  ) ?? html.match(
    /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/rss\+xml["'][^>]*>/i,
  );
  return match?.[1];
}

function parseRssEntry(entry: string): ParsedRssEntry {
  const title = entry.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
  const link =
    entry.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] ??
    entry.match(/<link[^>]*>([^<]+)<\/link>/i)?.[1]?.trim();
  const image =
    entry.match(/<(?:media:thumbnail|media:content)[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1] ??
    entry.match(/<enclosure[^>]+type=["']image\/[^"']+["'][^>]+url=["']([^"']+)["']/i)?.[1];
  const video =
    entry.match(/<enclosure[^>]+type=["']video\/[^"']+["'][^>]+url=["']([^"']+)["']/i)?.[1] ??
    entry.match(/<(?:yt:videoId)>([^<]+)<\/(?:yt:videoId)>/i)?.[1];
  const audio = entry.match(/<enclosure[^>]+type=["']audio\/[^"']+["'][^>]+url=["']([^"']+)["']/i)?.[1];

  return {
    title: title ? decodeHtml(title) : undefined,
    link,
    image,
    video: video && !video.startsWith("http") ? `https://www.youtube.com/watch?v=${video}` : video,
    audio,
  };
}

export function extractRssEntries(xml: string, limit = 8): ParsedRssEntry[] {
  const blocks = xml.match(/<(?:entry|item)\b[\s\S]*?<\/(?:entry|item)>/gi) ?? [];
  return blocks.slice(0, limit).map(parseRssEntry).filter((item) => item.title || item.link);
}

export function extractFirstRssEntry(xml: string): ParsedRssEntry | null {
  return extractRssEntries(xml, 1)[0] ?? null;
}

export function youtubeIdsInText(value: string) {
  const ids = new Set<string>();
  const pattern = /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    ids.add(match[1]!);
  }
  return [...ids];
}

export function pickMediaFromSources(args: {
  kind: SocialMediaKindName;
  oembed?: OEmbedPayload | null;
  og?: OpenGraphMedia | null;
  rss?: ParsedRssEntry | null;
}) {
  const { kind, oembed, og, rss } = args;
  const caption = oembed?.title ?? og?.title ?? rss?.title ?? og?.description ?? oembed?.author_name;
  const postUrl = oembed?.url ?? og?.url ?? rss?.link;

  if (kind === "AUDIO") {
    const url = og?.audio ?? rss?.audio ?? postUrl ?? oembed?.url;
    if (url) {
      return { url, kind, caption, embedHtml: oembed?.html, postUrl };
    }
  }

  if (kind === "VIDEO") {
    const url = og?.video ?? rss?.video ?? postUrl ?? oembed?.url;
    if (url) {
      return {
        url,
        kind,
        caption,
        embedHtml: oembed?.html,
        postUrl,
        image: oembed?.thumbnail_url ?? og?.image ?? rss?.image,
      };
    }
  }

  const image = oembed?.thumbnail_url ?? og?.image ?? rss?.image;
  if (image) {
    return { url: image, kind: "IMAGE" as const, caption, embedHtml: oembed?.html, postUrl };
  }

  if (kind === "IMAGE" && (og?.video || rss?.video || oembed?.url)) {
    return {
      url: og?.video ?? rss?.video ?? oembed?.url ?? postUrl ?? "",
      kind: "VIDEO" as const,
      caption,
      embedHtml: oembed?.html,
      postUrl,
    };
  }

  return null;
}
