"use client";

import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/outline";

import { api } from "~/trpc/react";

const money = (value?: number | null) => {
  if (!value || Number.isNaN(value)) return "R 0";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format((value || 0) / 100);
  } catch {
    return `R ${((value || 0) / 100).toFixed(0)}`;
  }
};

export function FeedSnippetsPanel({
  title = "Creator feed",
  subtitle = "Fresh drops across the marketplace",
  limit = 3,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  limit?: number;
  className?: string;
}) {
  const feedPreviewQuery = api.feed.list.useQuery({ limit });
  const posts = feedPreviewQuery.data?.items ?? [];
  const isLoading = feedPreviewQuery.isLoading;

  return (
    <section
      className={`rounded-3xl border border-blue-100 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300">{title}</p>
          <p className="text-sm text-gray-600 dark:text-slate-300">{subtitle}</p>
        </div>
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-4 py-1.5 text-xs font-semibold text-blue-700 hover:border-blue-400 dark:border-blue-500 dark:text-blue-200"
        >
          <SparklesIcon className="h-4 w-4" />
          Feed
        </Link>
      </div>
      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: limit }).map((_, index) => (
            <div
              key={index}
              className="skeleton h-16 rounded-2xl border border-dashed border-blue-100 dark:border-slate-700"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
          No creator stories yet. Share your first delivery recap in{" "}
          <Link href="/feed" className="text-blue-600 underline dark:text-blue-300">
            the feed
          </Link>
          .
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {posts.slice(0, limit).map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-blue-50 bg-blue-50/60 p-4 text-sm text-gray-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200"
            >
              <p className="text-xs uppercase text-gray-500 dark:text-slate-400">
                {post.type.replaceAll("_", " ")}
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {post.title ?? post.project?.name ?? "Update"}
              </p>
              {post.caption && (
                <p className="text-xs text-gray-600 dark:text-slate-300 line-clamp-2">{post.caption}</p>
              )}
              {post.payoutSummary && (
                <p className="mt-1 text-[11px] uppercase text-blue-700 dark:text-blue-300">
                  {money(post.payoutSummary.paidCents)} funded ·{" "}
                  {post.payoutSummary.contributorPayouts} payouts
                </p>
              )}
              {post.project?.id && (
                <Link
                  href={`/projects/${post.project.id}`}
                  className="mt-2 inline-flex text-xs font-semibold text-blue-700 dark:text-blue-300"
                >
                  View project →
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
