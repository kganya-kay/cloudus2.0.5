export const MEDIA_PULSE_KINDS = [
  "VIDEO",
  "SHORT",
  "SONG",
  "ALBUM",
  "PODCAST",
  "ARTICLE",
  "PERSON",
  "POST",
  "PHOTO",
  "CLIP",
  "LIVE",
  "TRAILER",
  "BOOK",
  "EVENT",
  "BLOG",
] as const;

export type MediaPulseKindName = (typeof MEDIA_PULSE_KINDS)[number];

export const KIND_LABELS: Record<MediaPulseKindName, string> = {
  VIDEO: "Video",
  SHORT: "Short",
  SONG: "Song",
  ALBUM: "Album",
  PODCAST: "Podcast",
  ARTICLE: "Article",
  PERSON: "Person",
  POST: "Post",
  PHOTO: "Photo",
  CLIP: "Clip",
  LIVE: "Live",
  TRAILER: "Trailer",
  BOOK: "Book",
  EVENT: "Event",
  BLOG: "Blog",
};

export const KIND_HINTS: Record<MediaPulseKindName, string> = {
  VIDEO: "YouTube, music videos, recaps",
  SHORT: "Reels, Shorts, TikToks",
  SONG: "Tracks and previews",
  ALBUM: "Projects and EPs",
  PODCAST: "Long-form audio",
  ARTICLE: "News and explainers",
  PERSON: "Artists, founders, celebrities",
  POST: "Social posts",
  PHOTO: "Stills and covers",
  CLIP: "Trailers and snippets",
  LIVE: "Streams and sessions",
  TRAILER: "Film and drop teasers",
  BOOK: "Books and notes",
  EVENT: "Nights and stages",
  BLOG: "Cloudus stories",
};

export function kindHasMedia(kind: MediaPulseKindName) {
  return kind !== "BLOG";
}
