const PLACEHOLDER = /cloudus-logo|cloudus-logo-final/i;

export function isPlaceholderMedia(url?: string | null) {
  if (!url?.trim()) return true;
  return PLACEHOLDER.test(url);
}

export function liveUrl(url?: string | null) {
  const value = url?.trim();
  if (!value || isPlaceholderMedia(value)) return null;
  return value;
}

export function pickLiveMedia(input: {
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  extraImages?: Array<string | null | undefined>;
}) {
  const imageUrl =
    liveUrl(input.imageUrl) ??
    input.extraImages?.map((item) => liveUrl(item)).find((item): item is string => Boolean(item)) ??
    null;
  const videoUrl = liveUrl(input.videoUrl);
  const audioUrl = liveUrl(input.audioUrl);
  if (!imageUrl && !videoUrl && !audioUrl) return null;
  return { imageUrl, videoUrl, audioUrl };
}

export function editionKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function editionBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
