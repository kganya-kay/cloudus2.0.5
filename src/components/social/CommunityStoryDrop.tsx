"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

import { Button, Card } from "~/components/os/primitives";
import { api } from "~/trpc/react";

import { SocialStoryFields } from "./SocialStoryFields";
import type { SocialStoryMedia } from "./types";

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export function CommunityStoryDrop() {
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [media, setMedia] = useState<SocialStoryMedia>({});
  const utils = api.useUtils();

  const userName = normalizeName(session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "my-blog");

  const createPost = api.blog.createPost.useMutation({
    onSuccess: async () => {
      setTitle("");
      setMedia({});
      await Promise.all([
        utils.blog.listPublicBlogs.invalidate(),
        utils.workspace.overview.invalidate(),
      ]);
    },
  });

  if (status !== "authenticated") {
    return (
      <Card>
        <h2 className="text-lg font-semibold">Drop</h2>
        <Button href="/auth/login?callbackUrl=/community" className="mt-4" size="sm">
          Sign in
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Drop</h2>
      </div>
      <label className="text-xs text-os-muted">
        Title
        <input
          className="os-field"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Latest from the room"
        />
      </label>
      <SocialStoryFields value={media} onChange={setMedia} />
      <Button
        disabled={
          createPost.isPending ||
          !title.trim() ||
          (!media.imageUrl && !media.videoUrl && !media.audioUrl)
        }
        onClick={() =>
          createPost.mutate({
            userName,
            title: title.trim(),
            coverImage: media.imageUrl,
            videoUrl: media.videoUrl,
            audioUrl: media.audioUrl,
            status: "PUBLISHED",
          })
        }
      >
        {createPost.isPending ? "Publishing…" : "Publish"}
      </Button>
      {createPost.error ? <p className="text-sm text-os-danger">{createPost.error.message}</p> : null}
    </Card>
  );
}
