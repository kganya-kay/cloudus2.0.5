"use client";

import { BlogPostStatus } from "@prisma/client";
import { useMemo, useState } from "react";

import { StoryOwnerTools } from "~/components/os/story-owner";
import { Badge, Button, Card, EmptyState, PageHeader } from "~/components/os/primitives";
import { BloggerNav } from "~/components/social/BloggerNav";
import { PostToSocials } from "~/components/social/PostToSocials";
import { SocialStoryFields } from "~/components/social/SocialStoryFields";
import { StoryMediaPlayer } from "~/components/social/StoryMediaPlayer";
import type { SocialStoryMedia } from "~/components/social/types";
import { PLATFORM_LABELS, type SocialPlatformName } from "~/lib/social/platforms";
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

const formatDate = (value: Date | null | undefined) => {
  if (!value) return "Draft";
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Published";
  }
};

export default function BlogComposer({
  routeUserName,
  sessionUserName,
  isSignedIn,
}: BlogComposerProps) {
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<SocialStoryMedia>({});
  const [status, setStatus] = useState<BlogPostStatus>(BlogPostStatus.PUBLISHED);

  const utils = api.useUtils();
  const profile = api.blog.profile.useQuery(
    { userName: routeUserName },
    { retry: false },
  );
  const posts = api.blog.listPosts.useQuery(
    {
      userName: routeUserName,
      includeDrafts: true,
      limit: 20,
    },
    { retry: false },
  );

  const canManage = useMemo(() => {
    if (profile.data?.viewerCanManage) return true;
    if (!isSignedIn || !sessionUserName) return false;
    return normalizeName(routeUserName) === normalizeName(sessionUserName);
  }, [isSignedIn, profile.data?.viewerCanManage, routeUserName, sessionUserName]);

  const createPost = api.blog.createPost.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.blog.profile.invalidate({ userName: routeUserName }),
        utils.blog.listPosts.invalidate({ userName: routeUserName }),
        utils.blog.listPublicBlogs.invalidate(),
      ]);
      setTitle("");
      setExcerpt("");
      setContent("");
      setMedia({});
      setStatus(BlogPostStatus.PUBLISHED);
    },
  });

  const blog = profile.data?.blog;
  const socials = blog?.owner.socialAccounts ?? [];
  const items = posts.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={blog?.title ?? routeUserName}
        actions={<BloggerNav current={canManage ? "mine" : "community"} />}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="os-kicker">@{blog?.userName ?? routeUserName}</p>
            <p className="mt-1 font-semibold">{blog?.owner.name ?? routeUserName}</p>
            <p className="os-muted">{blog?.postCount ?? items.length} stories</p>
          </div>
          {socials.map((account) => (
            <a
              key={`${account.platform}-${account.handle}`}
              href={account.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-os-elevated px-3 py-1 text-xs font-semibold"
            >
              {PLATFORM_LABELS[account.platform as SocialPlatformName]} @{account.handle}
            </a>
          ))}
        </div>
      </Card>

      {canManage ? (
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold">New</h2>

          <label className="text-xs text-os-muted">
            Title
            <input
              className="os-field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
            />
          </label>
          <label className="text-xs text-os-muted">
            Excerpt
            <input
              className="os-field"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="One line"
            />
          </label>
          <label className="text-xs text-os-muted">
            Story
            <textarea
              className="os-field"
              rows={6}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Story"
            />
          </label>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Media</p>
            {media.imageUrl || media.videoUrl || media.audioUrl ? (
              <StoryMediaPlayer
                imageUrl={media.imageUrl}
                videoUrl={media.videoUrl}
                audioUrl={media.audioUrl}
                title={title || "Story"}
              />
            ) : null}
            <SocialStoryFields value={media} onChange={setMedia} showFirstRun={false} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="os-field w-auto"
              value={status}
              onChange={(event) => setStatus(event.target.value as BlogPostStatus)}
            >
              <option value={BlogPostStatus.PUBLISHED}>Published</option>
              <option value={BlogPostStatus.DRAFT}>Draft</option>
              <option value={BlogPostStatus.ARCHIVED}>Archived</option>
            </select>
            <Button
              type="button"
              disabled={
                createPost.isPending ||
                !title.trim() ||
                (!content.trim() && !media.imageUrl && !media.videoUrl && !media.audioUrl)
              }
              onClick={() =>
                createPost.mutate({
                  userName: routeUserName,
                  title: title.trim(),
                  excerpt: excerpt.trim() || undefined,
                  content: content.trim() || undefined,
                  coverImage: media.imageUrl,
                  videoUrl: media.videoUrl,
                  audioUrl: media.audioUrl,
                  status,
                })
              }
            >
              {createPost.isPending ? "Saving…" : "Publish"}
            </Button>
            <PostToSocials
              title={title}
              excerpt={excerpt}
              content={content}
              imageUrl={media.imageUrl}
              videoUrl={media.videoUrl}
              audioUrl={media.audioUrl}
              permalink={`/Blog/${routeUserName}`}
            />
          </div>
          {createPost.error ? <p className="text-sm text-os-danger">{createPost.error.message}</p> : null}
        </Card>
      ) : !isSignedIn ? (
        <Card>
          <Button href={`/auth/login?callbackUrl=/Blog/${routeUserName}`} size="sm">
            Sign in
          </Button>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Stories</h2>
        {items.length === 0 ? (
          <EmptyState title="Empty" />
        ) : (
          items.map((post) => (
            <article key={post.id} className="os-card space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{post.title}</h3>
                <Badge tone={post.status === "PUBLISHED" ? "success" : "default"}>{post.status}</Badge>
                <span className="text-xs text-os-muted">{formatDate(post.publishedAt)}</span>
              </div>
              {post.excerpt ? <p className="os-muted">{post.excerpt}</p> : null}
              <StoryMediaPlayer
                imageUrl={post.coverImage}
                videoUrl={post.videoUrl}
                audioUrl={post.audioUrl}
                title={post.title}
              />
              {post.content ? <p className="whitespace-pre-wrap text-sm leading-6">{post.content}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button href={`/Blog/${routeUserName}/${post.slug}`} size="sm" variant="secondary">
                  Open
                </Button>
                {canManage ? (
                  <PostToSocials
                    title={post.title}
                    excerpt={post.excerpt}
                    content={post.content}
                    imageUrl={post.coverImage}
                    videoUrl={post.videoUrl}
                    audioUrl={post.audioUrl}
                    permalink={`/Blog/${routeUserName}/${post.slug}`}
                    prefetch
                  />
                ) : null}
              </div>
              {canManage ? (
                <StoryOwnerTools
                  canManage
                  userName={routeUserName}
                  post={{
                    id: post.id,
                    title: post.title,
                    excerpt: post.excerpt,
                    content: post.content,
                  }}
                />
              ) : null}
            </article>
          ))
        )}
      </section>

    </div>
  );
}
