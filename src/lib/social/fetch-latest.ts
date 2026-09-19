import {
  extractFirstRssEntry,
  extractOpenGraph,
  extractRssAlternate,
  pickMediaFromSources,
  type OEmbedPayload,
} from "./extract";
import {
  detectPlatform,
  guessRssUrl,
  isHttpUrl,
  isLikelyPostUrl,
  oEmbedEndpoint,
  type SocialMediaKindName,
  type SocialPlatformName,
} from "./platforms";

export type SocialFetchInput = {
  platform: SocialPlatformName;
  handle: string;
  profileUrl: string;
  rssUrl?: string | null;
  seedPostUrl?: string | null;
  latestPostUrl?: string | null;
  kind: SocialMediaKindName;
};

export type SocialFetchResult = {
  url: string;
  kind: SocialMediaKindName;
  caption?: string;
  embedHtml?: string;
  postUrl?: string;
};

const USER_AGENT =
  "CloudusSocialBot/1.0 (+https://cloudus.app; story import; public oEmbed/RSS/Open Graph only)";

async function fetchText(url: string, timeoutMs = 8000) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Could not read ${url} (${response.status})`);
  }
  return response.text();
}

async function fetchOEmbed(url: string): Promise<OEmbedPayload | null> {
  const endpoint = oEmbedEndpoint(url);
  if (!endpoint) return null;
  try {
    const text = await fetchText(endpoint);
    return JSON.parse(text) as OEmbedPayload;
  } catch {
    return null;
  }
}

async function fetchOpenGraph(url: string) {
  try {
    const html = await fetchText(url);
    return { html, og: extractOpenGraph(html), rss: extractRssAlternate(html) };
  } catch {
    return null;
  }
}

async function fetchRss(url: string) {
  try {
    return extractFirstRssEntry(await fetchText(url));
  } catch {
    return null;
  }
}

export async function fetchLatestSocialPost(input: SocialFetchInput): Promise<SocialFetchResult> {
  const candidates = [input.seedPostUrl, input.latestPostUrl, input.profileUrl].filter(
    (value): value is string => Boolean(value && isHttpUrl(value)),
  );

  const postUrl = candidates.find(isLikelyPostUrl) ?? candidates[0];
  const oembed = postUrl ? await fetchOEmbed(postUrl) : null;
  const page = postUrl ? await fetchOpenGraph(postUrl) : null;

  let rssUrl = input.rssUrl ?? guessRssUrl(input.platform, input.handle);
  if (!rssUrl && page?.rss) rssUrl = page.rss;
  if (!rssUrl && input.platform === "YOUTUBE") {
    const profile = await fetchOpenGraph(input.profileUrl);
    rssUrl = profile?.rss ?? rssUrl;
  }
  const rss = rssUrl ? await fetchRss(rssUrl) : null;

  const picked = pickMediaFromSources({
    kind: input.kind,
    oembed,
    og: page?.og,
    rss,
  });

  if (picked?.url) {
    return {
      url: picked.url,
      kind: picked.kind,
      caption: picked.caption,
      embedHtml: picked.embedHtml,
      postUrl: picked.postUrl ?? rss?.link ?? postUrl,
    };
  }

  if (input.profileUrl && postUrl !== input.profileUrl) {
    const profile = await fetchOpenGraph(input.profileUrl);
    const fallback = pickMediaFromSources({
      kind: input.kind,
      og: profile?.og,
      rss,
    });
    if (fallback?.url) {
      return {
        url: fallback.url,
        kind: fallback.kind,
        caption: fallback.caption,
        embedHtml: fallback.embedHtml,
        postUrl: fallback.postUrl ?? input.profileUrl,
      };
    }
  }

  const platform = input.platform || detectPlatform(input.profileUrl);
  throw new Error(
    `${platform} did not share a public ${input.kind.toLowerCase()}. Paste one public post URL once — Cloudus will keep dropping from there.`,
  );
}
