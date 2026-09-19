"use client";

import { useState } from "react";

import { OwnText } from "~/components/os/own-text";
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

  const mine = api.social.listMine.useQuery(undefined, { retry: false, enabled: !compact });
  const save = api.social.upsertAccount.useMutation({
    onSuccess: async () => {
      await utils.social.listMine.invalidate();
      setHandle("");
      setProfileUrl("");
      setSeedPostUrl("");
      onSaved?.();
    },
  });
  const update = api.social.updateAccount.useMutation({
    onSuccess: async () => {
      await utils.social.listMine.invalidate();
      onSaved?.();
    },
  });
  const remove = api.social.removeAccount.useMutation({
    onSuccess: async () => {
      await utils.social.listMine.invalidate();
      onSaved?.();
    },
  });

  return (
    <div className="space-y-4">
      {!compact && (mine.data?.length ?? 0) > 0 ? (
        <ul className="space-y-2">
          {mine.data?.map((account) => (
            <li key={account.id} className="rounded-2xl bg-os-elevated px-3 py-2">
              <p className="text-[11px] font-semibold">
                {PLATFORM_LABELS[account.platform as SocialPlatformName]}
                {account.isPrimary ? " · primary" : ""}
              </p>
              <OwnText
                canManage
                text={account.handle}
                busy={update.isPending || remove.isPending}
                onSave={(next) => update.mutate({ accountId: account.id, handle: next })}
                onDelete={() => remove.mutate({ accountId: account.id })}
              />
            </li>
          ))}
        </ul>
      ) : null}
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
      {!compact ? <h3 className="text-lg font-semibold">Connect</h3> : null}

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
        Post URL
        <input
          className="os-field"
          placeholder="https://…"
          value={seedPostUrl}
          onChange={(event) => setSeedPostUrl(event.target.value)}
        />
      </label>

      {save.error ? <p className="text-sm text-os-danger">{save.error.message}</p> : null}

      <Button type="submit" size="sm" disabled={save.isPending || (!handle.trim() && !profileUrl.trim())}>
        {save.isPending ? "Saving…" : "Save"}
      </Button>
    </form>
    </div>
  );
}
