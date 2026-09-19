import { iframeSrcForUrl, isDirectFileUrl } from "~/lib/social/embed";

import type { SocialDropValue } from "./types";

function MediaFrame({ url, title, kind }: { url: string; title?: string; kind: "IMAGE" | "VIDEO" | "AUDIO" }) {
  if (kind === "IMAGE" || (kind !== "AUDIO" && /\.(jpg|jpeg|png|gif|webp|avif)(\?|$)/i.test(url))) {
    return <img src={url} alt={title ?? "Story image"} className="max-h-96 w-full rounded-2xl object-cover" />;
  }

  if (isDirectFileUrl(url) && kind === "AUDIO") {
    return <audio src={url} controls className="w-full" />;
  }

  if (isDirectFileUrl(url)) {
    return <video src={url} controls playsInline className="w-full rounded-2xl bg-black" />;
  }

  const iframeSrc = iframeSrcForUrl(url);
  if (iframeSrc) {
    return (
      <iframe
        src={iframeSrc}
        title={title ?? "Social media"}
        className="aspect-video w-full rounded-2xl border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-os-accent">
      Open original
    </a>
  );
}

export function StoryMediaPlayer({
  imageUrl,
  videoUrl,
  audioUrl,
  title,
}: {
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  title?: string;
}) {
  if (!imageUrl && !videoUrl && !audioUrl) return null;

  return (
    <div className="space-y-3">
      {imageUrl ? <MediaFrame url={imageUrl} title={title} kind="IMAGE" /> : null}
      {videoUrl ? <MediaFrame url={videoUrl} title={title} kind="VIDEO" /> : null}
      {audioUrl ? <MediaFrame url={audioUrl} title={title} kind="AUDIO" /> : null}
    </div>
  );
}

export function SocialDropPreview({ value }: { value: SocialDropValue }) {
  return <MediaFrame url={value.url} title={value.caption ?? undefined} kind={value.kind} />;
}
