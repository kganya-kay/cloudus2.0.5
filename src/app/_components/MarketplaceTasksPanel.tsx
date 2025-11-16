"use client";

import Link from "next/link";

import { api } from "~/trpc/react";

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

export function MarketplaceTasksPanel({
  role,
  limit,
  title = "Available tasks",
  subtitle = "Claim or bid to earn from Cloudus projects",
}: {
  role?: "SUPPLIER" | "DRIVER" | "CREATOR";
  limit?: number;
  title?: string;
  subtitle?: string;
}) {
  const tasksQuery = api.project.marketplaceTasks.useQuery({ limit, role });
  const tasks = tasksQuery.data ?? [];
  const isLoading = tasksQuery.isLoading;

  return (
    <section className="rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <Link
          href="/projects"
          className="rounded-full border border-blue-200 px-4 py-1.5 text-xs font-semibold text-blue-700"
        >
          View all
        </Link>
      </div>
      {isLoading ? (
        <p className="mt-4 text-sm text-gray-500">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No unassigned tasks right now. Check back soon or browse{" "}
          <Link href="/feed" className="text-blue-600 underline">
            the feed
          </Link>{" "}
          for new drops.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => (
            <article
              key={task.id}
              className="rounded-2xl border border-blue-50 bg-blue-50/60 p-3 text-sm text-gray-700"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.project.name}</p>
                </div>
                <p className="text-xs font-semibold text-blue-700">
                  {formatCurrency(task.budgetCents)}
                </p>
              </div>
              {task.description && (
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{task.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase text-blue-700">
                {(task.skills ?? []).slice(0, 3).map((skill) => (
                  <span key={skill} className="rounded-full bg-white px-2 py-0.5">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/projects/${task.project.id}`}
                  className="inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  View project
                </Link>
                <Link
                  href={`/projects/${task.project.id}#tasks`}
                  className="inline-flex rounded-full border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-700"
                >
                  Claim or bid
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
