"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { StoryOwnerTools } from "~/components/os/story-owner";
import { Button } from "~/components/os/primitives";
import { BloggerNav } from "~/components/social/BloggerNav";
import { PostToSocials } from "~/components/social/PostToSocials";
import { StoryMediaPlayer } from "~/components/social/StoryMediaPlayer";
import { paginateHtml, toBookHtml } from "~/lib/blog/html";

import { BookStage } from "./BookStage";

type BookReaderPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
};

export function BookReader({
  userName,
  bookTitle,
  author,
  post,
  canManage,
}: {
  userName: string;
  bookTitle: string;
  author?: string | null;
  post: BookReaderPost;
  canManage?: boolean;
}) {
  const pages = useMemo(() => {
    const html = toBookHtml(post.content);
    const leaves = paginateHtml(html);
    return [null, ...leaves];
  }, [post.content]);

  const [index, setIndex] = useState(0);
  const [turning, setTurning] = useState(false);

  const go = useCallback((next: number) => {
    setIndex((current) => {
      if (next < 0 || next >= pages.length || next === current) return current;
      setTurning(true);
      window.setTimeout(() => setTurning(false), 420);
      return next;
    });
  }, [pages.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const leaf = pages[index];
  const open = index > 0;

  return (
    <div className="life-desk space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="os-kicker">{bookTitle}</p>
        <BloggerNav />
      </div>

      <BookStage
        title={post.title}
        author={author}
        image={post.coverImage}
        chapters={pages.length - 1}
        open={open}
        turning={turning}
        onCoverClick={() => go(open ? 0 : 1)}
        onLeafClick={(side) => go(side === "right" ? index + 1 : index - 1)}
      >
        {leaf ? (
          <article className="book-prose" dangerouslySetInnerHTML={{ __html: leaf }} />
        ) : (
          <div className="flex h-full flex-col justify-end gap-4 p-2">
            <p className="font-display text-3xl leading-tight">{post.title}</p>
            {post.excerpt ? <p className="os-muted">{post.excerpt}</p> : null}
            <p className="text-xs uppercase tracking-[0.2em] text-os-burgundy">{author}</p>
          </div>
        )}
      </BookStage>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => go(index - 1)}>
          Back
        </Button>
        <p className="text-xs text-os-muted">
          {index + 1} / {pages.length}
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={index >= pages.length - 1}
          onClick={() => go(index + 1)}
        >
          Turn
        </Button>
      </div>

      {post.videoUrl || post.audioUrl ? (
        <StoryMediaPlayer
          imageUrl={null}
          videoUrl={post.videoUrl}
          audioUrl={post.audioUrl}
          title={post.title}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canManage ? (
          <>
            <PostToSocials
              title={post.title}
              excerpt={post.excerpt}
              content={post.content}
              imageUrl={post.coverImage}
              videoUrl={post.videoUrl}
              audioUrl={post.audioUrl}
              permalink={`/Blog/${userName}/${post.slug}`}
              prefetch
            />
            <StoryOwnerTools
              canManage
              userName={userName}
              post={{
                id: post.id,
                title: post.title,
                excerpt: post.excerpt,
                content: post.content,
              }}
            />
          </>
        ) : null}
        <Button href={`/Blog/${userName}`} size="sm" variant="secondary">
          Blog
        </Button>
      </div>
    </div>
  );
}
