"use client";

import { BlogPostStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import { BookCanvas } from "~/components/blog/BookCanvas";
import { BookShelf } from "~/components/blog/BookShelf";
import { BookStage } from "~/components/blog/BookStage";
import { Button } from "~/components/os/primitives";
import { BloggerNav } from "~/components/social/BloggerNav";
import { PostToSocials } from "~/components/social/PostToSocials";
import { SocialStoryFields } from "~/components/social/SocialStoryFields";
import type { SocialStoryMedia } from "~/components/social/types";
import { excerptFromHtml, firstImageSrc, stripHtml } from "~/lib/blog/html";
import { api } from "~/trpc/react";

type BlogComposerProps = {
  routeUserName: string;
  sessionUserName: string | null;
  isSignedIn: boolean;
};

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

type Mode = "cover" | "open" | "write" | "bound";

export default function BlogComposer({
  routeUserName,
  sessionUserName,
  isSignedIn,
}: BlogComposerProps) {
  const [mode, setMode] = useState<Mode>("cover");
  const [turning, setTurning] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<SocialStoryMedia>({});
  const [status, setStatus] = useState<BlogPostStatus>(BlogPostStatus.PUBLISHED);
  const [canvasKey, setCanvasKey] = useState(0);

  const utils = api.useUtils();
  const profile = api.blog.profile.useQuery(
    { userName: routeUserName },
    { retry: false },
  );
  const posts = api.blog.listPosts.useQuery(
    {
      userName: routeUserName,
      includeDrafts: true,
      limit: 50,
    },
    { retry: false },
  );

  const canManage = useMemo(() => {
    if (profile.data?.viewerCanManage) return true;
    if (!isSignedIn || !sessionUserName) return false;
    return normalizeName(routeUserName) === normalizeName(sessionUserName);
  }, [isSignedIn, profile.data?.viewerCanManage, routeUserName, sessionUserName]);

  const items = useMemo(
    () =>
      [...(posts.data?.items ?? [])].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [posts.data?.items],
  );

  const resetPage = () => {
    setTitle("");
    setExcerpt("");
    setContent("");
    setMedia({});
    setStatus(BlogPostStatus.PUBLISHED);
    setCanvasKey((key) => key + 1);
  };

  const createPost = api.blog.createPost.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.blog.profile.invalidate({ userName: routeUserName }),
        utils.blog.listPosts.invalidate({ userName: routeUserName }),
        utils.blog.listPublicBlogs.invalidate(),
      ]);
      resetPage();
      setMode("bound");
      window.setTimeout(() => setMode("cover"), 1700);
    },
  });

  const blog = profile.data?.blog;
  const bookTitle = blog?.title ?? routeUserName;
  const author = blog?.owner.name ?? routeUserName;
  const chapterTitle = title.trim() || `Post ${items.length + 1}`;
  const chapterCover = media.imageUrl ?? firstImageSrc(content) ?? null;
  const coverImage = chapterCover ?? items.at(-1)?.coverImage ?? null;
  const hasStory = Boolean(stripHtml(content) || media.imageUrl || media.videoUrl || media.audioUrl);
  const open = mode !== "cover";

  const turnTo = (next: Mode) => {
    setTurning(true);
    setMode(next);
    window.setTimeout(() => setTurning(false), 680);
  };

  const bind = () => {
    createPost.mutate({
      userName: routeUserName,
      title: chapterTitle,
      excerpt: excerpt.trim() || excerptFromHtml(content) || undefined,
      content: stripHtml(content) ? content.trim() : undefined,
      coverImage: chapterCover ?? undefined,
      videoUrl: media.videoUrl,
      audioUrl: media.audioUrl,
      status,
    });
  };

  return (
    <div className="life-desk space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="os-kicker">@{blog?.userName ?? routeUserName}</p>
        <BloggerNav current={canManage ? "mine" : "community"} />
      </div>

      <BookStage
        title={bookTitle}
        author={author}
        image={coverImage}
        chapters={items.length}
        open={open}
        binding={mode === "bound"}
        turning={turning}
        onCoverClick={() => (open ? setMode("cover") : turnTo(canManage ? "write" : "open"))}
      >
        {mode === "bound" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="font-display text-4xl">In the book.</p>
            <p className="os-muted">Your post is on the shelf.</p>
          </div>
        ) : canManage && mode === "write" ? (
          <div className="space-y-4">
            <input
              className="book-title-field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={`Post ${items.length + 1}`}
            />
            <input
              className="book-excerpt-field"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="One line"
            />
            <BookCanvas key={canvasKey} value={content} onChange={setContent} disabled={createPost.isPending} />
          </div>
        ) : (
          <div className="flex h-full flex-col justify-between gap-6">
            <div>
              <p className="os-kicker">Blog</p>
              <p className="mt-3 font-display text-3xl leading-tight">{bookTitle}</p>
              <p className="mt-2 os-muted">
                {items.length} post{items.length === 1 ? "" : "s"} in the book
              </p>
            </div>
            {canManage ? (
              <Button type="button" onClick={() => turnTo("write")}>
                Write
              </Button>
            ) : !isSignedIn ? (
              <Button href={`/auth/login?callbackUrl=/Blog/${routeUserName}`} size="sm">
                Sign in
              </Button>
            ) : null}
          </div>
        )}
      </BookStage>

      {mode === "cover" ? (
        <div className="flex justify-center gap-3">
          {canManage ? (
            <Button type="button" onClick={() => turnTo("write")}>
              Write
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={() => turnTo("open")}>
              Open
            </Button>
          )}
        </div>
      ) : null}

      {canManage && mode === "write" ? (
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <SocialStoryFields value={media} onChange={setMedia} showFirstRun={false} />
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="os-field w-auto"
              value={status}
              onChange={(event) => setStatus(event.target.value as BlogPostStatus)}
            >
              <option value={BlogPostStatus.PUBLISHED}>Publish</option>
              <option value={BlogPostStatus.DRAFT}>Draft</option>
            </select>
            <Button
              type="button"
              disabled={createPost.isPending || !hasStory}
              onClick={bind}
            >
              {createPost.isPending ? "…" : "Publish"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("cover")}>
              Close
            </Button>
            <PostToSocials
              title={chapterTitle}
              excerpt={excerpt}
              content={content}
              imageUrl={coverImage}
              videoUrl={media.videoUrl}
              audioUrl={media.audioUrl}
              permalink={`/Blog/${routeUserName}`}
            />
          </div>
          {createPost.error ? <p className="text-sm text-os-danger">{createPost.error.message}</p> : null}
        </div>
      ) : null}

      <BookShelf
        books={items.map((post, index) => ({
          href: `/Blog/${routeUserName}/${post.slug}`,
          title: post.title,
          author: String(index + 1),
          image: post.coverImage,
        }))}
      />
    </div>
  );
}
