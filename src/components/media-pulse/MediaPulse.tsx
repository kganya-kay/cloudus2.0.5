"use client";

import { useEffect, useMemo, useState } from "react";

import { editorialAsStories } from "~/lib/media-pulse/catalog";
import { KIND_LABELS, type MediaPulseKindName } from "~/lib/media-pulse/kinds";
import type { PulseFrontpage, PulseStory } from "~/lib/media-pulse/types";
import { api } from "~/trpc/react";

import { NewspaperMedia } from "./NewspaperMedia";
import { TopicFilterBar } from "./TopicFilterBar";

const LEAD_MS = 10000;
const RAIL_MS = 3500;

function withMedia(stories: PulseStory[]) {
  return stories.filter((story) => story.imageUrl || story.videoUrl || story.audioUrl);
}

export function MediaPulse({ initial }: { initial?: PulseFrontpage | null }) {
  const [kind, setKind] = useState<MediaPulseKindName | undefined>();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const fallback = useMemo(() => {
    const stories = editorialAsStories();
    return { lead: stories[0]!, rail: stories.slice(1, 5), kinds: stories.map((item) => item.kind) };
  }, []);

  const pulse = api.mediaPulse.frontpage.useQuery(
    { kind },
    {
      retry: false,
      initialData: kind ? undefined : initial ?? undefined,
      placeholderData: (previous) => previous,
    },
  );
  const mark = api.mediaPulse.markInterest.useMutation();
  const page = pulse.data ?? initial ?? fallback;
  const stories = withMedia([page.lead, ...page.rail]);
  const safeStories = stories.length ? stories : withMedia(editorialAsStories());
  const current = safeStories[index % safeStories.length] ?? safeStories[0]!;
  const isLead = index % safeStories.length === 0;

  useEffect(() => {
    setIndex(0);
  }, [kind, page.lead.id]);

  useEffect(() => {
    if (playing || safeStories.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wait = isLead ? LEAD_MS : RAIL_MS;
    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % safeStories.length);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [index, isLead, playing, safeStories.length]);

  const selectKind = (next?: MediaPulseKindName) => {
    setKind(next);
    if (next) mark.mutate({ topic: next.toLowerCase(), source: "FILTER" });
  };

  return (
    <section className="os-paper" aria-label="Cloudus Daily">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 sm:px-6">
        <p className="os-kicker">Daily</p>
        <TopicFilterBar value={kind} onChange={selectKind} />
      </div>

      <article className="space-y-3 p-5 sm:p-6">
        <NewspaperMedia story={current} featured onPlayingChange={setPlaying} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-os-muted">
          {KIND_LABELS[current.kind]}
        </p>
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
        {safeStories.length > 1 ? (
          <div className="flex gap-1.5 pt-1" aria-hidden>
            {safeStories.map((story, storyIndex) => (
              <button
                key={story.id}
                type="button"
                onClick={() => setIndex(storyIndex)}
                className={`h-1.5 rounded-full transition ${
                  storyIndex === index % safeStories.length ? "w-6 bg-os-fg" : "w-2 bg-os-border"
                }`}
                aria-label={`Story ${storyIndex + 1}`}
              />
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}
