"use client";

import { useEffect, useState } from "react";

import { pickLiveMedia } from "~/lib/media-pulse/media";
import type { PulseFrontpage, PulseStory } from "~/lib/media-pulse/types";
import { api } from "~/trpc/react";

import { DailyEar } from "./DailyEar";
import { NewspaperMedia } from "./NewspaperMedia";

const LEAD_MS = 10000;
const RAIL_MS = 3500;

function liveStories(stories: PulseStory[]) {
  return stories.filter((story) => pickLiveMedia(story));
}

export function MediaPulse({ initial }: { initial?: PulseFrontpage | null }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);

  const pulse = api.mediaPulse.frontpage.useQuery(
    {},
    {
      retry: false,
      initialData: initial ?? undefined,
      placeholderData: (previous) => previous,
    },
  );
  const mark = api.mediaPulse.markInterest.useMutation();
  const page = pulse.data ?? initial ?? { stories: [], kinds: [] };
  const stories = liveStories(page.stories);
  const current = stories[index % Math.max(stories.length, 1)];
  const isLead = index % Math.max(stories.length, 1) === 0;

  useEffect(() => {
    setIndex(0);
  }, [page.stories[0]?.id]);

  useEffect(() => {
    if (hovered || playing || stories.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wait = isLead ? LEAD_MS : RAIL_MS;
    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % stories.length);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [hovered, index, isLead, playing, stories.length]);

  return (
    <section
      className={`os-newsprint transition duration-300 ${hovered ? "z-10 scale-[1.03] shadow-os" : ""}`}
      aria-label="Cloudus Daily"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-4 sm:px-6">
        <p className="os-kicker shrink-0">Daily</p>
        <DailyEar />
      </div>

      {current ? (
        <article className="space-y-3 p-5 sm:p-6">
          <NewspaperMedia story={current} featured onPlayingChange={setPlaying} />
          <h3 className="os-paper-headline text-2xl sm:text-4xl">{current.title}</h3>
          <p className="os-muted line-clamp-1">{current.dek}</p>
          <a
            href={current.sourceUrl}
            target={current.sourceUrl.startsWith("/") ? undefined : "_blank"}
            rel={current.sourceUrl.startsWith("/") ? undefined : "noreferrer"}
            onClick={() => mark.mutate({ topic: current.topic, source: "STORY" })}
            className="inline-flex min-h-10 items-center rounded-full bg-os-fg px-4 text-xs font-semibold text-os-bg"
          >
            Open
          </a>
          {stories.length > 1 ? (
            <div className="flex gap-1.5 pt-1" aria-hidden>
              {stories.map((story, storyIndex) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => setIndex(storyIndex)}
                  className={`h-1.5 rounded-full transition ${
                    storyIndex === index % stories.length ? "w-6 bg-os-fg" : "w-2 bg-os-border"
                  }`}
                  aria-label={`Story ${storyIndex + 1}`}
                />
              ))}
            </div>
          ) : null}
        </article>
      ) : (
        <article className="p-5 sm:p-6">
          <p className="os-muted">Quiet.</p>
        </article>
      )}
    </section>
  );
}
