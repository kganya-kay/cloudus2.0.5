"use client";

import { PlayableMedia } from "~/components/media/PlayableMedia";

import type { SocialDropValue } from "./types";

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
    <PlayableMedia
      imageUrl={imageUrl}
      videoUrl={videoUrl}
      audioUrl={audioUrl}
      title={title}
    />
  );
}

export function SocialDropPreview({ value }: { value: SocialDropValue }) {
  return (
    <PlayableMedia
      imageUrl={value.kind === "IMAGE" ? value.url : undefined}
      videoUrl={value.kind === "VIDEO" ? value.url : undefined}
      audioUrl={value.kind === "AUDIO" ? value.url : undefined}
      title={value.caption ?? undefined}
    />
  );
}
