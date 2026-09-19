"use client";

import { KIND_LABELS, type MediaPulseKindName } from "~/lib/media-pulse/kinds";

const CHIPS = ["VIDEO", "SONG", "ARTICLE", "PERSON", "PHOTO", "BLOG"] as const;

export function TopicFilterBar({
  value,
  onChange,
}: {
  value?: MediaPulseKindName;
  available?: MediaPulseKindName[];
  onChange: (kind?: MediaPulseKindName) => void;
}) {
  return (
    <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={`min-h-8 shrink-0 rounded-full px-2.5 text-[11px] font-semibold ${
          !value ? "bg-os-fg text-os-bg" : "bg-os-elevated text-os-muted"
        }`}
      >
        All
      </button>
      {CHIPS.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onChange(kind)}
          className={`min-h-8 shrink-0 rounded-full px-2.5 text-[11px] font-semibold ${
            value === kind ? "bg-os-fg text-os-bg" : "bg-os-elevated text-os-muted"
          }`}
        >
          {KIND_LABELS[kind]}
        </button>
      ))}
    </div>
  );
}
