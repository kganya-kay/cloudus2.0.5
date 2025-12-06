"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BoltIcon,
  PhotoIcon,
  PlayCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
import { UploadButton } from "~/utils/uploadthing";

type FeedItem = RouterOutputs["feed"]["list"]["items"][number];

const formatCurrency = (value?: number | null) => {
  if (!value || Number.isNaN(value)) return "R 0";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(value / 100);
  } catch {
    return `R ${(value / 100).toFixed(0)}`;
  }
};

// Helper to extract URL from UploadThing response
function getUploadedUrl(files: unknown): string | undefined {
  if (!Array.isArray(files) || files.length === 0) return undefined;
  const f = files[0] as Record<string, unknown>;
  const pick = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v : undefined);
  return (
    pick(f.url) ??
    pick(f.ufsUrl) ??
    pick((f.serverData as Record<string, unknown> | undefined)?.url) ??
    (pick(f.key) ? `https://utfs.io/f/${String(f.key)}` : undefined)
  );
}

export function FeedClient() {
  const feedQuery = api.feed.list.useInfiniteQuery(
    { limit: 8 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
  );
  const reactMutation = api.feed.react.useMutation({
    onSuccess: () => void feedQuery.refetch(),
  });
  const publishMutation = api.feed.publish.useMutation({
    onSuccess: async () => {
      setTitle("");
      setCaption("");
      setCover("");
      setTagsInput("");
      setProjectId(undefined);
      await feedQuery.refetch();
    },
    onError: (error) => {
      alert(error?.message ?? "Please sign in to post a drop.");
    },
  });

  const ownedProjects = api.project.getAll.useQuery();
  const contributorOverview = api.project.contributorOverview.useQuery();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [cover, setCover] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [projectId, setProjectId] = useState<number | undefined>(undefined);

  const posts = feedQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isLoading = feedQuery.isLoading && posts.length === 0;
  const canLoadMore = Boolean(feedQuery.hasNextPage);

  const emptyState = !isLoading && posts.length === 0;

  const projectOptions = useMemo(() => {
    const options: { id: number; name: string; badge: string }[] = [];
    ownedProjects.data?.forEach((p) => {
      options.push({ id: p.id, name: p.name, badge: "Owned" });
    });
    contributorOverview.data?.activeTasks.forEach((task) => {
      if (task.project?.id && !options.some((o) => o.id === task.project?.id)) {
        options.push({
          id: task.project.id,
          name: task.project.name ?? `Project #${task.project.id}`,
          badge: "Assigned",
        });
      }
    });
    return options;
  }, [ownedProjects.data, contributorOverview.data]);

  return (
    <div className="space-y-4">
      <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <PhotoIcon className="mt-1 h-6 w-6 text-blue-500" />
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600">Share a drop</p>
              <p className="text-sm text-gray-600">Post a project/task update to the feed.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="rounded-xl border px-3 py-2 text-sm"
              />
              <div className="rounded-xl border px-3 py-2">
                <p className="text-xs text-gray-500">Cover image (optional)</p>
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    const url = getUploadedUrl(res);
                    if (url) setCover(url);
                  }}
                  onUploadError={(error: Error) => alert(`Upload error: ${error.message}`)}
                />
                {cover && (
                  <img src={cover} alt="Cover preview" className="mt-2 h-16 w-16 rounded-lg object-cover" />
                )}
              </div>
              <div className="rounded-xl border px-3 py-2">
                <p className="text-xs text-gray-500">Project / Task (optional)</p>
                <select
                  value={projectId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProjectId(val ? Number(val) : undefined);
                  }}
                  className="mt-1 w-full rounded-lg border px-2 py-1 text-sm text-gray-700"
                >
                  <option value="">No link</option>
                  {projectOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} ({opt.badge})
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Tags comma separated (optional)"
                className="rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What happened? Share progress, blockers, or wins."
              className="w-full rounded-xl border px-3 py-2 text-sm"
              rows={3}
            />
            <div className="flex flex-wrap justify-between gap-3">
              <div className="text-xs text-gray-500">
                Drops appear in the feed for collaborators and the community.
              </div>
              <button
                type="button"
                onClick={() => {
                  const tags = tagsInput
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  publishMutation.mutate({
                    title: title.trim() || undefined,
                    caption: caption.trim() || undefined,
                    coverImage: cover || undefined,
                    tags,
                    projectId,
                    type: "PROJECT_UPDATE",
                  });
                }}
                disabled={publishMutation.isPending || (!caption.trim() && !title.trim())}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {publishMutation.isPending ? "Posting..." : "Post drop"}
              </button>
            </div>
          </div>
        </div>
      </article>

      {isLoading && (
        <div className="rounded-3xl border border-blue-100 bg-white/70 p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading creator updates...</p>
        </div>
      )}

      {emptyState && (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-white/70 p-6 text-center text-sm text-gray-600 shadow-sm">
          <p>No stories yet. Be the first to share your project update.</p>
          <Link
            href="/creators/dashboard"
            className="mt-3 inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Publish an update
          </Link>
        </div>
      )}

      {posts.map((post) => (
        <FeedCard
          key={post.id}
          post={post}
          onReact={() => reactMutation.mutate({ postId: post.id, type: "LIKE" })}
          reacting={reactMutation.isPending}
        />
      ))}

      {canLoadMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => feedQuery.fetchNextPage()}
            disabled={feedQuery.isFetchingNextPage}
            className="rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400"
          >
            {feedQuery.isFetchingNextPage ? "Loading more..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

function FeedCard({
  post,
  onReact,
  reacting,
}: {
  post: FeedItem;
  onReact: () => void;
  reacting: boolean;
}) {
  const cover = post.media[0]?.url ?? post.coverImage;
  const hasProject = Boolean(post.project);
  const hasShopItem = Boolean(post.shopItem);
  const avatar =
    post.creator.avatarUrl ??
    post.creator.user?.image ??
    "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV";

  const projectLink = hasProject ? `/projects/${post.project?.id}` : undefined;
  const shopLink = hasShopItem ? `/shop/${post.shopItem?.id}` : undefined;

  const byline = useMemo(() => {
    const handle = `@${post.creator.handle}`;
    if (post.project?.name) {
      return `${handle} • ${post.project.status}`;
    }
    if (post.shopItem?.name) {
      return `${handle} • Shop drop`;
    }
    return handle;
  }, [post.creator.handle, post.project, post.shopItem]);

  return (
    <article className="rounded-3xl border border-gray-100 bg-white/80 shadow-sm transition hover:border-blue-100">
      {cover && (
        <div className="relative overflow-hidden rounded-t-3xl bg-slate-100">
          <img
            src={cover}
            alt={post.title ?? "Creator update"}
            className="h-60 w-full object-cover"
            loading="lazy"
          />
          {post.type === "VIDEO" && (
            <span className="absolute inset-0 flex items-center justify-center">
              <PlayCircleIcon className="h-16 w-16 text-white drop-shadow-lg" />
            </span>
          )}
        </div>
      )}

      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <img src={avatar} alt={post.creator.displayName} className="h-10 w-10 rounded-full" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{post.creator.displayName}</p>
            <p className="text-xs text-gray-500">{byline}</p>
          </div>
        </div>

        <div className="space-y-2">
          {post.title && <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>}
          {post.caption && <p className="text-sm text-gray-700">{post.caption}</p>}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {(hasProject || hasShopItem) && (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4 text-sm text-gray-700">
            {hasProject && (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Featured project</p>
                    <p className="font-semibold text-gray-900">{post.project?.name}</p>
                  </div>
                  {projectLink && (
                    <Link
                      href={projectLink}
                      className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                    >
                      View
                    </Link>
                  )}
                </div>
                {post.payoutSummary && (
                  <p className="text-xs text-gray-500">
                    {formatCurrency(post.payoutSummary.paidCents)} funded ·{" "}
                    {post.payoutSummary.contributorPayouts} contributor payouts
                  </p>
                )}
              </div>
            )}
            {hasShopItem && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase text-gray-500">Shop drop</p>
                  <p className="font-semibold text-gray-900">{post.shopItem?.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(post.shopItem?.price ?? 0)}
                  </p>
                </div>
                {shopLink && (
                  <Link
                    href={shopLink}
                    className="rounded-full border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-700"
                  >
                    Explore
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onReact}
            disabled={reacting}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-1.5 text-xs font-semibold text-blue-700 hover:border-blue-400 disabled:opacity-60"
          >
            <SparklesIcon className="h-4 w-4" />
            Appreciate
          </button>
          <Link
            href="/creators/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
          >
            <BoltIcon className="h-4 w-4" />
            Share update
          </Link>
        </div>
      </div>
    </article>
  );
}
