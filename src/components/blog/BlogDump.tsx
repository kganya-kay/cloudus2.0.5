"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

import { BookCanvas } from "~/components/blog/BookCanvas";
import { Button } from "~/components/os/primitives";
import { SocialStoryFields } from "~/components/social/SocialStoryFields";
import type { SocialStoryMedia } from "~/components/social/types";
import { excerptFromHtml, firstImageSrc, stripHtml, titleFromDump } from "~/lib/blog/html";
import { api } from "~/trpc/react";

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export function BlogDump({
  compact,
  showMedia,
  seedTitle,
  seedContent,
  onPublished,
}: {
  compact?: boolean;
  showMedia?: boolean;
  seedTitle?: string;
  seedContent?: string;
  onPublished?: () => void;
}) {
  const { data: session, status } = useSession();
  const [title, setTitle] = useState(seedTitle ?? "");
  const [content, setContent] = useState(seedContent ?? "");
  const [media, setMedia] = useState<SocialStoryMedia>({});
  const [canvasKey, setCanvasKey] = useState(0);
  const utils = api.useUtils();

  const userName = normalizeName(session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "my-blog");

  const createPost = api.blog.createPost.useMutation({
    onSuccess: async () => {
      setTitle("");
      setContent("");
      setMedia({});
      setCanvasKey((key) => key + 1);
      await Promise.all([
        utils.blog.listPublicBlogs.invalidate(),
        utils.blog.listRecentPosts.invalidate(),
        utils.blog.listPosts.invalidate(),
        utils.workspace.overview.invalidate(),
      ]);
      onPublished?.();
    },
  });

  if (status !== "authenticated") {
    return (
      <Button href="/auth/login?callbackUrl=/Blog/me" size="sm">
        Sign in
      </Button>
    );
  }

  const hasStory = Boolean(stripHtml(content) || media.imageUrl || media.videoUrl || media.audioUrl);

  return (
    <div className="space-y-3">
      <input
        className="book-title-field text-2xl"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Title"
      />
      <BookCanvas
        key={canvasKey}
        value={content}
        onChange={setContent}
        compact={compact}
        disabled={createPost.isPending}
        placeholder="Paste a draft…"
      />
      {showMedia ? <SocialStoryFields value={media} onChange={setMedia} showFirstRun={false} /> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={createPost.isPending || !hasStory}
          onClick={() =>
            createPost.mutate({
              userName,
              title: title.trim() || titleFromDump(content),
              excerpt: excerptFromHtml(content) || undefined,
              content: stripHtml(content) ? content.trim() : undefined,
              coverImage: media.imageUrl ?? firstImageSrc(content),
              videoUrl: media.videoUrl,
              audioUrl: media.audioUrl,
              status: "PUBLISHED",
            })
          }
        >
          {createPost.isPending ? "…" : "Publish"}
        </Button>
        <Button href="/Blog/me" size="sm" variant="ghost">
          Open
        </Button>
      </div>
      {createPost.error ? <p className="text-sm text-os-danger">{createPost.error.message}</p> : null}
    </div>
  );
}

export function DumpToBook({
  text,
  title,
}: {
  text: string;
  title?: string;
}) {
  const { data: session, status } = useSession();
  const utils = api.useUtils();
  const userName = normalizeName(session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "my-blog");

  const createPost = api.blog.createPost.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.blog.listPublicBlogs.invalidate(),
        utils.blog.listRecentPosts.invalidate(),
        utils.workspace.overview.invalidate(),
      ]);
    },
  });

  if (status !== "authenticated" || !text.trim()) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={createPost.isPending}
      onClick={() =>
        createPost.mutate({
          userName,
          title: titleFromDump(title || text),
          excerpt: excerptFromHtml(text) || undefined,
          content: text,
          status: "PUBLISHED",
        })
      }
    >
      {createPost.isPending ? "…" : "To blog"}
    </Button>
  );
}
