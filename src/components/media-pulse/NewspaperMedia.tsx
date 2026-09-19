"use client";

import { PlayableMedia } from "~/components/media/PlayableMedia";
import type { PulseStory } from "~/lib/media-pulse/types";

export function NewspaperMedia({
  story,
  featured,
  onPlayingChange,
}: {
  story: PulseStory;
  featured?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}) {
  return (
    <PlayableMedia
      imageUrl={story.imageUrl}
      videoUrl={story.videoUrl}
      audioUrl={story.audioUrl}
      title={story.title}
      featured={featured}
      onPlayingChange={onPlayingChange}
    />
  );
}
