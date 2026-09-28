"use client";

import { VideoCameraIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { pickLiveMedia } from "~/lib/media-pulse/media";
import type { PulseFrontpage, PulseStory } from "~/lib/media-pulse/types";
import { api } from "~/trpc/react";

import { TvScreen } from "./TvScreen";

const STILL_MS = 9000;
const STORE = "cloudus.daily.tv";

function channels(stories: PulseStory[]) {
  return stories.filter((story) => story.kind === "LIVE" || pickLiveMedia(story));
}

function readStore() {
  if (typeof window === "undefined") return { muted: true, index: 0 };
  try {
    const raw = window.sessionStorage.getItem(STORE);
    const next = raw ? (JSON.parse(raw) as { muted?: boolean; index?: number }) : {};
    return { muted: next.muted ?? true, index: next.index ?? 0 };
  } catch {
    return { muted: true, index: 0 };
  }
}

export function DailyTV({
  size,
  initial,
}: {
  size: "stage" | "dock";
  initial?: PulseFrontpage | null;
}) {
  const stored = useRef(readStore());
  const [index, setIndex] = useState(stored.current.index);
  const [muted, setMuted] = useState(stored.current.muted);
  const [playing, setPlaying] = useState(false);
  const [held, setHeld] = useState(false);
  const [folded, setFolded] = useState(false);
  const glassRef = useRef<HTMLDivElement>(null);

  const pulse = api.mediaPulse.frontpage.useQuery(
    {},
    {
      retry: false,
      refetchInterval: 8000,
      initialData: initial ?? undefined,
      placeholderData: (previous) => previous,
    },
  );
  const mark = api.mediaPulse.markInterest.useMutation();
  const stories = channels(pulse.data?.stories ?? initial?.stories ?? []);
  const current = stories[index % Math.max(stories.length, 1)];
  const live = current?.kind === "LIVE";
  const hasStream = Boolean(current?.videoUrl || current?.audioUrl);

  useEffect(() => {
    window.sessionStorage.setItem(STORE, JSON.stringify({ muted, index }));
  }, [index, muted]);

  const next = useCallback(() => {
    if (stories.length < 2) return;
    setIndex((value) => (value + 1) % stories.length);
  }, [stories.length]);

  useEffect(() => {
    if (held || playing || live || hasStream || stories.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(next, STILL_MS);
    return () => window.clearTimeout(timer);
  }, [hasStream, held, live, next, playing, stories.length, current?.id]);

  const open = () => {
    if (!current) return;
    mark.mutate({ topic: current.topic, source: "STORY" });
    if (current.sourceUrl.startsWith("/")) {
      window.location.href = current.sourceUrl;
      return;
    }
    window.open(current.sourceUrl, "_blank", "noreferrer");
  };

  const onGlass = () => {
    if (muted) {
      setMuted(false);
      return;
    }
    open();
  };

  const fullscreen = () => {
    const node = glassRef.current;
    if (!node) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void node.requestFullscreen();
  };

  if (size === "dock" && folded) {
    return (
      <button
        type="button"
        className="daily-tv-pill"
        onClick={() => setFolded(false)}
        aria-label="Daily"
      >
        <span className={`daily-tv-led ${live ? "is-live" : "is-on"}`} />
      </button>
    );
  }

  return (
    <section
      className={`daily-tv ${size === "dock" ? "is-dock" : "is-stage"}`}
      aria-label="Daily"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
    >
      <div className="daily-tv-chassis">
        <div className="daily-tv-bezel">
          <div ref={glassRef} className="daily-tv-glass" onClick={onGlass}>
            {current ? (
              <TvScreen
                key={current.id}
                imageUrl={current.imageUrl}
                videoUrl={current.videoUrl}
                audioUrl={current.audioUrl}
                live={live}
                muted={muted}
                onPlayingChange={setPlaying}
                onEnded={next}
              />
            ) : (
              <span className="daily-tv-void" />
            )}
            <span className="daily-tv-scan" />
            <span className="daily-tv-shine" />
          </div>
        </div>
        <div className="daily-tv-bar">
          <span className={`daily-tv-led ${live ? "is-live" : "is-on"}`} />
          <div className="daily-tv-pips" aria-hidden>
            {stories.map((story, storyIndex) => (
              <button
                key={story.id}
                type="button"
                onClick={() => setIndex(storyIndex)}
                className={`daily-tv-pip ${storyIndex === index % Math.max(stories.length, 1) ? "is-on" : ""} ${
                  story.kind === "LIVE" ? "is-live" : ""
                }`}
              />
            ))}
          </div>
          <div className="daily-tv-dials">
            <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Sound" : "Mute"}>
              <MuteGlyph off={muted} />
            </button>
            <button type="button" onClick={fullscreen} aria-label="Full">
              <ExpandGlyph />
            </button>
            <Link href="/studio/session" aria-label="Live">
              <VideoCameraIcon className="h-4 w-4" />
            </Link>
            {size === "dock" ? (
              <button type="button" onClick={() => setFolded(true)} aria-label="Fold">
                <FoldGlyph />
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {size === "stage" ? <div className="daily-tv-stand" /> : null}
    </section>
  );
}

function MuteGlyph({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      {off ? (
        <path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3 2.1-2.1 1.4 1.4L18 13.4l2 2-1.4 1.4-2.1-2.1-2.1 2.1-1.4-1.4 2.1-2 2.1-2.1-1.4-1.4z" />
      ) : (
        <path d="M4 9v6h4l5 4V5L8 9H4zm11 3a4 4 0 0 0-2-3.5v7A4 4 0 0 0 15 12zm2 0a6 6 0 0 0-3-5.2v2.1A4 4 0 0 1 16 12a4 4 0 0 1-2 3.1v2.1A6 6 0 0 0 17 12z" />
      )}
    </svg>
  );
}

function ExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M7 14H5v5h5v-2H7v-3zm12 5h-5v-2h3v-3h2v5zM7 7h3V5H5v5h2V7zm12 3h-2V7h-3V5h5v5z" />
    </svg>
  );
}

function FoldGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M7 11h10v2H7z" />
    </svg>
  );
}

export function MediaPulse({ initial }: { initial?: PulseFrontpage | null }) {
  return <DailyTV size="stage" initial={initial} />;
}
