"use client";

import { useSession } from "next-auth/react";

import { api } from "~/trpc/react";

import { SocialAccountCapture } from "./SocialAccountCapture";
import { SocialMediaDrop } from "./SocialMediaDrop";
import type { SocialDropValue, SocialStoryMedia } from "./types";

type SocialStoryFieldsProps = {
  value: SocialStoryMedia;
  onChange: (value: SocialStoryMedia) => void;
  showFirstRun?: boolean;
};

function toDrop(url: string | undefined, kind: SocialDropValue["kind"]): SocialDropValue | null {
  return url ? { url, kind } : null;
}

export function SocialStoryFields({ value, onChange, showFirstRun = true }: SocialStoryFieldsProps) {
  const { status } = useSession();
  const utils = api.useUtils();
  const accounts = api.social.listMine.useQuery(undefined, {
    enabled: status === "authenticated",
    retry: false,
  });
  const needsFirstRun =
    showFirstRun && status === "authenticated" && (accounts.data?.length ?? 0) === 0 && !accounts.isLoading;

  return (
    <div className="space-y-4">
      {needsFirstRun ? (
        <div className="os-card p-4">
          <SocialAccountCapture onSaved={() => void utils.social.listMine.invalidate()} />
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <SocialMediaDrop
          kind="IMAGE"
          label="Picture"
          compact
          showCapture={false}
          value={toDrop(value.imageUrl, "IMAGE")}
          onChange={(next) => onChange({ ...value, imageUrl: next?.url })}
        />
        <SocialMediaDrop
          kind="VIDEO"
          label="Video"
          compact
          showCapture={false}
          value={toDrop(value.videoUrl, "VIDEO")}
          onChange={(next) => onChange({ ...value, videoUrl: next?.url })}
        />
        <SocialMediaDrop
          kind="AUDIO"
          label="Sound"
          compact
          showCapture={false}
          value={toDrop(value.audioUrl, "AUDIO")}
          onChange={(next) => onChange({ ...value, audioUrl: next?.url })}
        />
      </div>
    </div>
  );
}
