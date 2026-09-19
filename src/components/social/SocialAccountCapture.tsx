"use client";

import { useState } from "react";

import { Button } from "~/components/os/primitives";
import { PLATFORM_LABELS, SOCIAL_PLATFORMS, type SocialPlatformName } from "~/lib/social/platforms";
import { api } from "~/trpc/react";

type SocialAccountCaptureProps = {
  onSaved?: () => void;
  compact?: boolean;
};

export function SocialAccountCapture({ onSaved, compact }: SocialAccountCaptureProps) {
  const [platform, setPlatform] = useState<SocialPlatformName>("INSTAGRAM");
  const [handle, setHandle] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [seedPostUrl, setSeedPostUrl] = useState("");
  const utils = api.useUtils();

  const save = api.social.upsertAccount.useMutation({
    onSuccess: async () => {
      await utils.social.listMine.invalidate();
      setHandle("");
      setProfileUrl("");
      setSeedPostUrl("");
      onSaved?.();
    },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate({
          platform,
          handle: handle || undefined,
          profileUrl: profileUrl || undefined,
          seedPostUrl: seedPostUrl || undefined,
          makePrimary: true,
        });
      }}
    >
      {!compact ? (
        <div>
          <p className="os-kicker">First run</p>
          <h3 className="mt-1 text-lg font-semibold">Connect one social</h3>
          <p className="os-muted mt-1">
            Handle or profile URL is enough. A public post URL helps Instagram, TikTok, and X keep dropping.
          </p>
        </div>
      ) : null}

      <label className="text-xs text-os-muted">
        Platform
        <select
          className="os-field"
          value={platform}
          onChange={(event) => setPlatform(event.target.value as SocialPlatformName)}
        >
          {SOCIAL_PLATFORMS.map((item) => (
            <option key={item} value={item}>
              {PLATFORM_LABELS[item]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs text-os-muted">
        Handle
        <input
          className="os-field"
          placeholder="@yourname"
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
        />
      </label>

      <label className="text-xs text-os-muted">
        Profile URL
        <input
          className="os-field"
          placeholder="https://instagram.com/yourname"
          value={profileUrl}
          onChange={(event) => setProfileUrl(event.target.value)}
        />
      </label>

      <label className="text-xs text-os-muted">
        Latest public post URL (optional, recommended)
        <input
          className="os-field"
          placeholder="Paste one public post, reel, or track"
          value={seedPostUrl}
          onChange={(event) => setSeedPostUrl(event.target.value)}
        />
      </label>

      {save.error ? <p className="text-sm text-os-danger">{save.error.message}</p> : null}

      <Button type="submit" size="sm" disabled={save.isPending || (!handle.trim() && !profileUrl.trim())}>
        {save.isPending ? "Saving…" : "Save social"}
      </Button>
    </form>
  );
}
