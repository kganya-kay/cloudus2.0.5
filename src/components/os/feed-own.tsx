"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

import { OwnBar } from "./own-text";
import { Button } from "./primitives";

export function FeedOwn({
  postId,
  title,
  caption,
  canManage,
}: {
  postId: string;
  title?: string | null;
  caption?: string | null;
  canManage?: boolean;
}) {
  const utils = api.useUtils();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [nextTitle, setNextTitle] = useState(title ?? "");
  const [nextCaption, setNextCaption] = useState(caption ?? "");

  const update = api.feed.update.useMutation({
    onSuccess: async () => {
      setMode("view");
      await Promise.all([utils.feed.list.invalidate(), utils.workspace.overview.invalidate()]);
    },
  });
  const remove = api.feed.remove.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.feed.list.invalidate(), utils.workspace.overview.invalidate()]);
    },
  });

  if (!canManage) return null;
  const busy = update.isPending || remove.isPending;

  if (mode === "edit") {
    return (
      <div className="space-y-2">
        <input
          className="os-field"
          value={nextTitle}
          onChange={(event) => setNextTitle(event.target.value)}
          placeholder="Title"
        />
        <textarea
          className="os-field"
          rows={3}
          value={nextCaption}
          onChange={(event) => setNextCaption(event.target.value)}
          placeholder="Caption"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() =>
              update.mutate({
                id: postId,
                title: nextTitle.trim(),
                caption: nextCaption.trim(),
              })
            }
          >
            Save
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode("view")}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <OwnBar
      canManage
      busy={busy}
      onEdit={() => {
        setNextTitle(title ?? "");
        setNextCaption(caption ?? "");
        setMode("edit");
      }}
      onDelete={() => remove.mutate({ id: postId })}
    />
  );
}
