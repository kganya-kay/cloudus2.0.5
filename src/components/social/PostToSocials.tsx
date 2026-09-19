"use client";

import { Dialog, DialogPanel } from "@headlessui/react";
import { toPng } from "html-to-image";
import { useRef, useState } from "react";

import { Button } from "~/components/os/primitives";
import { fallbackSocialCaption } from "~/lib/social/caption";
import { openInstagramComposer } from "~/lib/social/instagram";
import { api } from "~/trpc/react";

import { StoryMediaPlayer } from "./StoryMediaPlayer";

export type PostToSocialsProps = {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  permalink?: string;
  prefetch?: boolean;
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Instagram still opens; caption stays on the preview.
  }
}

function downloadPng(dataUrl: string, name: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = name;
  link.click();
}

async function shareImage(dataUrl: string, caption: string) {
  if (!navigator.share || !navigator.canShare) return false;
  const blob = await fetch(dataUrl).then((response) => response.blob());
  const file = new File([blob], "cloudus-story.png", { type: "image/png" });
  if (!navigator.canShare({ files: [file] })) return false;
  await navigator.share({ files: [file], text: caption });
  return true;
}

export function PostToSocials({
  title,
  excerpt,
  content,
  imageUrl,
  videoUrl,
  audioUrl,
  permalink,
  prefetch,
}: PostToSocialsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = title.trim().length >= 3;
  const absolutePermalink = permalink
    ? permalink.startsWith("http")
      ? permalink
      : typeof window === "undefined"
        ? permalink
        : new URL(permalink, window.location.origin).href
    : undefined;
  const accounts = api.social.listMine.useQuery(undefined, {
    enabled: ready,
    retry: false,
  });
  const craft = api.social.craftPreview.useQuery(
    {
      title: title.trim(),
      excerpt: excerpt?.trim() || undefined,
      content: content?.trim() || undefined,
      permalink: absolutePermalink,
    },
    {
      enabled: ready && (prefetch || open),
      retry: false,
      staleTime: 60_000,
    },
  );

  const instagram = (accounts.data ?? []).find((account) => account.platform === "INSTAGRAM");
  const caption =
    craft.data?.caption ??
    fallbackSocialCaption({ title, excerpt, content, permalink: absolutePermalink });

  const post = async () => {
    if (!cardRef.current) {
      await copyText(caption);
      openInstagramComposer();
      return;
    }
    setBusy(true);
    try {
      await copyText(caption);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#f3eee4",
      });
      downloadPng(dataUrl, "cloudus-story.png");
      const shared = await shareImage(dataUrl, caption).catch(() => false);
      if (!shared) openInstagramComposer();
    } catch {
      openInstagramComposer();
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Post to Socials
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50" aria-hidden />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <DialogPanel className="mx-auto w-full max-w-md space-y-4">
            <div
              ref={cardRef}
              className="os-newsprint-sheet aspect-[4/5] space-y-4 p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="os-kicker">Cloudus</p>
                {instagram ? <p className="text-xs font-semibold">@{instagram.handle}</p> : null}
              </div>
              <StoryMediaPlayer
                imageUrl={imageUrl}
                videoUrl={videoUrl}
                audioUrl={audioUrl}
                title={title}
              />
              <h3 className="os-paper-headline text-2xl leading-tight">{title}</h3>
              <p className="whitespace-pre-wrap text-sm leading-6">{caption}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={busy} onClick={() => void post()}>
                {busy ? "Opening…" : "Post to Socials"}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
