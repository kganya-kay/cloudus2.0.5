export const SOCIAL_PLATFORMS = [
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE",
  "X",
  "FACEBOOK",
  "SOUNDCLOUD",
  "SPOTIFY",
  "OTHER",
] as const;

export type SocialPlatformName = (typeof SOCIAL_PLATFORMS)[number];
export type SocialMediaKindName = "IMAGE" | "VIDEO" | "AUDIO";

export const PLATFORM_LABELS: Record<SocialPlatformName, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  X: "X",
  FACEBOOK: "Facebook",
  SOUNDCLOUD: "SoundCloud",
  SPOTIFY: "Spotify",
  OTHER: "Other",
};

const HOST_TO_PLATFORM: Array<[RegExp, SocialPlatformName]> = [
  [/instagram\.com$/i, "INSTAGRAM"],
  [/tiktok\.com$/i, "TIKTOK"],
  [/youtube\.com$/i, "YOUTUBE"],
  [/youtu\.be$/i, "YOUTUBE"],
  [/(^|\.)x\.com$/i, "X"],
  [/(^|\.)twitter\.com$/i, "X"],
  [/facebook\.com$/i, "FACEBOOK"],
  [/fb\.watch$/i, "FACEBOOK"],
  [/soundcloud\.com$/i, "SOUNDCLOUD"],
  [/spotify\.com$/i, "SPOTIFY"],
];

const handlePattern = /^@?[a-z0-9._-]{2,64}$/i;

export function normalizeHandle(value: string) {
  return value.trim().replace(/^@/, "").replace(/\/+$/, "");
}

export function hostFromUrl(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function detectPlatform(value: string): SocialPlatformName {
  const trimmed = value.trim();
  if (isHttpUrl(trimmed)) {
    const host = hostFromUrl(trimmed);
    const match = HOST_TO_PLATFORM.find(([pattern]) => pattern.test(host));
    return match?.[1] ?? "OTHER";
  }
  return "OTHER";
}

export function buildProfileUrl(platform: SocialPlatformName, handle: string) {
  const clean = normalizeHandle(handle);
  switch (platform) {
    case "INSTAGRAM":
      return `https://www.instagram.com/${clean}/`;
    case "TIKTOK":
      return `https://www.tiktok.com/@${clean}`;
    case "YOUTUBE":
      return `https://www.youtube.com/@${clean}`;
    case "X":
      return `https://x.com/${clean}`;
    case "FACEBOOK":
      return `https://www.facebook.com/${clean}`;
    case "SOUNDCLOUD":
      return `https://soundcloud.com/${clean}`;
    case "SPOTIFY":
      return `https://open.spotify.com/user/${clean}`;
    default:
      return handlePattern.test(clean) ? `https://${clean}` : clean;
  }
}

export function resolveSocialIdentity(input: {
  platform?: SocialPlatformName | string;
  handle?: string;
  profileUrl?: string;
}) {
  const rawUrl = input.profileUrl?.trim() ?? "";
  const rawHandle = input.handle?.trim() ?? "";
  const platformFromUrl = rawUrl ? detectPlatform(rawUrl) : "OTHER";
  const platform = (input.platform as SocialPlatformName | undefined) ?? platformFromUrl;

  if (rawUrl && isHttpUrl(rawUrl)) {
    const handleFromPath = normalizeHandle(
      new URL(rawUrl).pathname.split("/").filter(Boolean).at(-1) ?? rawHandle,
    );
    return {
      platform: platform === "OTHER" ? platformFromUrl : platform,
      handle: handleFromPath || normalizeHandle(rawHandle) || "profile",
      profileUrl: rawUrl,
    };
  }

  const handle = normalizeHandle(rawHandle);
  if (!handle) {
    throw new Error("Add a social handle or a public profile URL.");
  }

  return {
    platform,
    handle,
    profileUrl: buildProfileUrl(platform, handle),
  };
}

export function guessRssUrl(platform: SocialPlatformName, handle: string) {
  const clean = normalizeHandle(handle);
  if (platform === "YOUTUBE") {
    return `https://www.youtube.com/feeds/videos.xml?user=${encodeURIComponent(clean)}`;
  }
  return null;
}

export function oEmbedEndpoint(url: string) {
  const platform = detectPlatform(url);
  const encoded = encodeURIComponent(url);
  switch (platform) {
    case "YOUTUBE":
      return `https://www.youtube.com/oembed?url=${encoded}&format=json`;
    case "TIKTOK":
      return `https://www.tiktok.com/oembed?url=${encoded}`;
    case "X":
      return `https://publish.twitter.com/oembed?url=${encoded}`;
    case "INSTAGRAM":
      return `https://api.instagram.com/oembed?url=${encoded}`;
    case "SOUNDCLOUD":
      return `https://soundcloud.com/oembed?format=json&url=${encoded}`;
    case "SPOTIFY":
      return `https://open.spotify.com/oembed?url=${encoded}`;
    case "FACEBOOK":
      return `https://www.facebook.com/plugins/post/oembed.json/?url=${encoded}`;
    default:
      return null;
  }
}

export function preferredKindForPlatform(platform: SocialPlatformName): SocialMediaKindName {
  if (platform === "SOUNDCLOUD" || platform === "SPOTIFY") return "AUDIO";
  if (platform === "YOUTUBE" || platform === "TIKTOK") return "VIDEO";
  return "IMAGE";
}

export function isLikelyPostUrl(url: string) {
  if (!isHttpUrl(url)) return false;
  const path = new URL(url).pathname.toLowerCase();
  return (
    path.includes("/p/") ||
    path.includes("/reel") ||
    path.includes("/status/") ||
    path.includes("/watch") ||
    path.includes("/shorts/") ||
    path.includes("/video/") ||
    path.includes("/tracks/") ||
    path.includes("/track/") ||
    path.includes("/episode/") ||
    /\/(photo|posts)\//.test(path)
  );
}
