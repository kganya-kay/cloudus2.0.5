export function youtubeIdFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "") || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v") ?? parsed.pathname.split("/").filter(Boolean).at(-1) ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export function isDirectFileUrl(url: string) {
  return (
    /\.(mp4|webm|mov|m4v|mp3|wav|ogg|m4a|aac|jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(url) ||
    url.includes("utfs.io") ||
    url.includes("ufs.sh")
  );
}

export function iframeSrcForUrl(url: string) {
  const youtubeId = youtubeIdFromUrl(url);
  if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}`;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("tiktok.com")) {
      return `https://www.tiktok.com/embed/${url.split("/").filter(Boolean).at(-1) ?? ""}`;
    }
    if (host.includes("soundcloud.com")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false`;
    }
    if (host.includes("open.spotify.com")) {
      return url.replace("open.spotify.com/", "open.spotify.com/embed/");
    }
  } catch {
    return null;
  }
  return null;
}
