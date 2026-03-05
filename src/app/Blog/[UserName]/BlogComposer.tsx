"use client";

import Link from "next/link";
import { BlogPostStatus } from "@prisma/client";
import { useMemo, useState } from "react";

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
  const [status, setStatus] = useState<BlogPostStatus>(BlogPostStatus.DRAFT);

  const utils = api.useUtils();
  const [profile] = api.blog.profile.useSuspenseQuery({ userName: routeUserName });
  const [posts] = api.blog.listPosts.useSuspenseQuery({
    userName: routeUserName,
    includeDrafts: true,
    limit: 20,
  });

  const canCreateForRoute = useMemo(() => {
    if (profile.viewerCanManage) return true;
    if (!isSignedIn || !sessionUserName) return false;
    return normalizeName(routeUserName) === normalizeName(sessionUserName);
  }, [isSignedIn, profile.viewerCanManage, routeUserName, sessionUserName]);

  const createPost = api.blog.createPost.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.blog.profile.invalidate({ userName: routeUserName }),
        utils.blog.listPosts.invalidate({ userName: routeUserName }),
      ]);
      setTitle("");
      setExcerpt("");
      setContent("");
      setStatus(BlogPostStatus.DRAFT);
    },
  });

  if (!isSignedIn) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900">Sign in to manage this blog</h2>
        <p className="mt-2 text-sm text-gray-600">
          Route: <span className="font-mono">/Blog/{routeUserName}</span>
        </p>
        <Link
          href="/api/auth/signin"
          className="mt-4 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </section>
    );
  }

  if (!canCreateForRoute) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-amber-900">Username mismatch</h2>
        <p className="mt-2 text-sm text-amber-800">
          You are signed in as <strong>{sessionUserName ?? "unknown"}</strong>, but this page is for{" "}
          <strong>{routeUserName}</strong>.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide text-blue-600">Blog Studio</p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {profile.blog?.title ?? `${routeUserName}'s Blog`}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Route: <span className="font-mono">/Blog/{routeUserName}</span>
          </p>
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim() || !content.trim()) return;
            createPost.mutate({
              userName: routeUserName,
              title: title.trim(),
              excerpt: excerpt.trim() || undefined,
              content: content.trim(),
              status,
            });
          }}
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="blog-title">
              Title
            </label>
            <input
              id="blog-title"
              type="text"
              placeholder="A strong post title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="blog-excerpt">
              Excerpt
            </label>
            <input
              id="blog-excerpt"
              type="text"
              placeholder="One-line summary"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="blog-content">
              Content
            </label>
            <textarea
              id="blog-content"
              rows={8}
              placeholder="Write your post content here"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-900 outline-none ring-blue-500 focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="blog-status">
              Status
            </label>
            <select
              id="blog-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as BlogPostStatus)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value={BlogPostStatus.DRAFT}>Draft</option>
              <option value={BlogPostStatus.PUBLISHED}>Published</option>
              <option value={BlogPostStatus.ARCHIVED}>Archived</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createPost.isPending || !title.trim() || !content.trim()}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createPost.isPending ? "Saving..." : "Create post"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Recent posts</h2>
        {posts.items.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No posts yet. Publish your first entry above.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {posts.items.map((post: (typeof posts.items)[number]) => (
              <article key={post.id} className="rounded-xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{post.title}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {post.status}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(post.publishedAt)}</span>
                </div>
                {post.excerpt && <p className="mt-2 text-sm text-gray-700">{post.excerpt}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
