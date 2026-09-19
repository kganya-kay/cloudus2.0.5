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
  if (story.kind === "LIVE" && !story.videoUrl && !story.imageUrl) {
    return (
      <div className="grid aspect-video place-items-center rounded-[1.2rem] bg-os-ink text-sm font-semibold text-[#f6edd9]">
        Live
      </div>
    );
  }

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
