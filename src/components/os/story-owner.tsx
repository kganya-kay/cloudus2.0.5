"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

import { OwnBar } from "./own-text";
import { Button } from "./primitives";

type StoryFields = {
  id: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
};

export function StoryOwnerTools({
  post,
  userName,
  canManage,
}: {
  post: StoryFields;
  userName?: string;
  canManage?: boolean;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [content, setContent] = useState(post.content ?? "");

  const refresh = async () => {
    await Promise.all([
      utils.blog.listPosts.invalidate(),
      utils.blog.listPublicBlogs.invalidate(),
      utils.workspace.overview.invalidate(),
    ]);
    router.refresh();
  };

  const update = api.blog.updatePost.useMutation({
    onSuccess: async () => {
      setOpen(false);
      await refresh();
    },
  });
  const remove = api.blog.deletePost.useMutation({
    onSuccess: async () => {
      await refresh();
      if (userName) router.push(`/Blog/${userName}`);
    },
  });

  if (!canManage) return null;

  const busy = update.isPending || remove.isPending;

  if (!open) {
    return (
      <OwnBar
        canManage
        busy={busy}
        onEdit={() => {
          setTitle(post.title);
          setExcerpt(post.excerpt ?? "");
          setContent(post.content ?? "");
          setOpen(true);
        }}
        onDelete={() => remove.mutate({ postId: post.id })}
      />
    );
  }

  return (
    <div className="space-y-3">
      <input className="os-field" value={title} onChange={(event) => setTitle(event.target.value)} />
      <input className="os-field" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} />
      <textarea
        className="os-field"
        rows={5}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy || !title.trim()}
          onClick={() =>
            update.mutate({
              postId: post.id,
              title: title.trim(),
              excerpt: excerpt.trim(),
              content,
            })
          }
        >
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );
}
