"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  BoltIcon,
  PhotoIcon,
  PlayCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

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

export function FeedClient() {
  const feedQuery = api.feed.list.useInfiniteQuery(
    { limit: 8 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
  );
  const reactMutation = api.feed.react.useMutation({
    onSuccess: () => void feedQuery.refetch(),
  });

  const posts = feedQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isLoading = feedQuery.isLoading && posts.length === 0;
  const canLoadMore = Boolean(feedQuery.hasNextPage);

  const emptyState = !isLoading && posts.length === 0;

  return (
    <div className="space-y-4">
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
