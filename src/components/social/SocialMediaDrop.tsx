"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { Badge, Button } from "~/components/os/primitives";
import { PLATFORM_LABELS } from "~/lib/social/platforms";
import { api } from "~/trpc/react";
import { UploadButton } from "~/utils/uploadthing";

import { SocialAccountCapture } from "./SocialAccountCapture";
import { SocialDropPreview } from "./StoryMediaPlayer";
import type { SocialDropValue, SocialMediaKindName } from "./types";

type SocialMediaDropProps = {
  kind?: SocialMediaKindName;
  label?: string;
  description?: string;
  value?: SocialDropValue | null;
  onChange?: (value: SocialDropValue | null) => void;
  compact?: boolean;
  showCapture?: boolean;
};

const uploadEndpoint = {
  IMAGE: "imageUploader",
  VIDEO: "videoUploader",
  AUDIO: "audioUploader",
} as const;

export function SocialMediaDrop({
  kind = "IMAGE",
  label,
  description,
  value,
  onChange,
  compact,
  showCapture = true,
}: SocialMediaDropProps) {
  const { status } = useSession();
  const [accountId, setAccountId] = useState<string>("");
  const [pasteUrl, setPasteUrl] = useState("");
  const [directUrl, setDirectUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const utils = api.useUtils();

  const accounts = api.social.listMine.useQuery(undefined, {
    enabled: status === "authenticated",
    retry: false,
  });

  const selectedAccount = useMemo(() => {
    const items = accounts.data ?? [];
    return items.find((item) => item.id === accountId) ?? items[0] ?? null;
  }, [accountId, accounts.data]);

  const job = api.social.getJob.useQuery(
    { jobId: jobId ?? "" },
    {
      enabled: Boolean(jobId),
      retry: false,
      refetchInterval: (query) => {
        const current = query.state.data;
        return current?.status === "QUEUED" || current?.status === "RUNNING" ? 1200 : false;
      },
    },
  );

  const requestLatest = api.social.requestLatest.useMutation({
    onSuccess: (created) => {
      setJobId(created.id);
      if (created.status === "READY" && created.resultUrl) {
        onChange?.({
          url: created.resultUrl,
          kind: created.resultKind ?? kind,
          caption: created.caption,
          embedHtml: created.embedHtml,
          source: "SOCIAL",
        });
      }
    },
  });

  useEffect(() => {
    if (job.data?.status !== "READY" || !job.data.resultUrl) return;
    if (value?.url === job.data.resultUrl) return;
    onChange?.({
      url: job.data.resultUrl,
      kind: job.data.resultKind ?? kind,
      caption: job.data.caption,
      embedHtml: job.data.embedHtml,
      source: "SOCIAL",
    });
    // Apply a finished job once. Parent onChange identities change every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.data?.id, job.data?.status, job.data?.resultUrl]);

  const heading =
    label ??
    (kind === "IMAGE" ? "Picture" : kind === "VIDEO" ? "Video" : "Sound");

  if (status !== "authenticated") {
    return (
      <div className="os-card space-y-3 p-4">
        <p className="text-sm font-semibold">{heading}</p>
        <Button href="/auth/login?callbackUrl=/Blog" size="sm">
          Sign in
        </Button>
      </div>
    );
  }

  const busy = requestLatest.isPending || job.data?.status === "QUEUED" || job.data?.status === "RUNNING";
  const hasAccounts = (accounts.data?.length ?? 0) > 0;

  return (
    <section className="os-card space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{heading}</p>
          {description ? <p className="os-muted">{description}</p> : null}
        </div>
        {busy ? <Badge tone="accent">Fetching…</Badge> : null}
      </div>

      {value ? (
        <div className="space-y-2">
          <SocialDropPreview value={value} />
          {value.caption ? <p className="os-muted line-clamp-2">{value.caption}</p> : null}
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange?.(null)}>
            Clear
          </Button>
        </div>
      ) : null}

      {!hasAccounts ? (
        showCapture ? (
          <SocialAccountCapture
            compact={compact}
            onSaved={() => {
              void utils.social.listMine.invalidate();
            }}
          />
        ) : (
          <p className="os-muted">Connect first.</p>
        )
      ) : (
        <div className="space-y-3">
          <label className="text-xs text-os-muted">
            Social
            <select
              className="os-field"
              value={selectedAccount?.id ?? ""}
              onChange={(event) => setAccountId(event.target.value)}
            >
              {(accounts.data ?? []).map((account) => (
                <option key={account.id} value={account.id}>
                  {PLATFORM_LABELS[account.platform]} @{account.handle}
                  {account.isPrimary ? " · primary" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy || !selectedAccount}
              onClick={() =>
                requestLatest.mutate({
                  accountId: selectedAccount?.id,
                  kind,
                  sourceUrl: pasteUrl || undefined,
                })
              }
            >
              {kind === "IMAGE" ? "Drop" : "Drop"}
            </Button>
            <UploadButton
              endpoint={uploadEndpoint[kind]}
              onClientUploadComplete={(res) => {
                const url = res?.[0]?.url;
                if (url) onChange?.({ url, kind, source: "UPLOAD" });
              }}
              appearance={{
                button: "ut-ready:bg-[var(--os-fg)] ut-ready:text-[var(--os-bg)] h-10 rounded-full px-3.5 text-xs font-semibold",
              }}
            />
          </div>

          <label className="text-xs text-os-muted">
            URL
            <div className="mt-1 flex gap-2">
              <input
                className="os-field mt-0"
                placeholder="https://…"
                value={pasteUrl}
                onChange={(event) => setPasteUrl(event.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!pasteUrl.trim() || busy}
                onClick={() =>
                  requestLatest.mutate({
                    accountId: selectedAccount?.id,
                    kind,
                    sourceUrl: pasteUrl.trim(),
                  })
                }
              >
                Import
              </Button>
            </div>
          </label>
        </div>
      )}

      <label className="text-xs text-os-muted">
        File URL
        <div className="mt-1 flex gap-2">
          <input
            className="os-field mt-0"
            placeholder="https://…"
            value={directUrl}
            onChange={(event) => setDirectUrl(event.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!directUrl.trim()}
            onClick={() => onChange?.({ url: directUrl.trim(), kind, source: "URL" })}
          >
            Use
          </Button>
        </div>
      </label>

      {job.data?.status === "FAILED" || requestLatest.error ? (
        <p className="text-sm text-os-danger">
          {job.data?.error ?? requestLatest.error?.message}
        </p>
      ) : null}

      {hasAccounts && !compact ? (
        <details className="rounded-2xl bg-os-elevated p-3">
          <summary className="cursor-pointer text-sm font-medium">Add</summary>
          <div className="mt-3">
            <SocialAccountCapture compact onSaved={() => void utils.social.listMine.invalidate()} />
          </div>
        </details>
      ) : null}

    </section>
  );
}
