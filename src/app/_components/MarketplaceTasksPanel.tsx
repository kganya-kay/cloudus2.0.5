"use client";

import Link from "next/link";
import { useState } from "react";

import { formatZarFromCents } from "~/lib/os/format";
import { api } from "~/trpc/react";

export function MarketplaceTasksPanel({
  role,
  limit,
  title = "Tasks",
  subtitle,
  defaultOpen = true,
  showBrowseLink = true,
}: {
  role?: "SUPPLIER" | "DRIVER" | "CREATOR";
  limit?: number;
  title?: string;
  subtitle?: string;
  defaultOpen?: boolean;
  showBrowseLink?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const tasksQuery = api.project.marketplaceTasks.useQuery({ limit, role }, { retry: false });
  const statsQuery = api.project.marketplaceTaskStats.useQuery({ role }, { retry: false });
  const tasks = tasksQuery.data ?? [];
  const isLoading = tasksQuery.isLoading || statsQuery.isLoading;
  const taskCount = statsQuery.data?.count ?? tasks.length;
  const potLabel = formatZarFromCents(statsQuery.data?.availableCents ?? 0);

  return (
    <details
      className="os-card group overflow-hidden"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <p className="os-kicker">{title}</p>
          <p className="mt-1 text-lg font-semibold">
            {isLoading ? "…" : `${taskCount} ${taskCount === 1 ? "task" : "tasks"}`}
          </p>
          {subtitle && defaultOpen ? <p className="os-muted mt-1">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-right">
          <p className="text-lg font-semibold tracking-tight">
            {isLoading ? "…" : potLabel}
          </p>
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-full bg-os-elevated text-sm transition group-open:rotate-180"
          >
            ▾
          </span>
        </div>
      </summary>

      <div className="space-y-3 border-t border-[var(--os-border)] px-5 pb-5 pt-4">
        {showBrowseLink ? (
          <div className="flex justify-end">
            <Link href="/projects" className="text-xs font-semibold text-os-accent">
              View all
            </Link>
          </div>
        ) : null}
        {isLoading ? (
          <p className="os-muted">…</p>
        ) : tasks.length === 0 ? (
          <p className="os-muted">None.</p>
        ) : (
          tasks.map((task) => (
            <article key={task.id} className="rounded-2xl bg-os-elevated p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{task.title}</p>
                  <p className="os-muted text-xs">{task.project.name}</p>
                </div>
                <p className="text-xs font-semibold">{formatZarFromCents(task.budgetCents)}</p>
              </div>
              {task.description ? (
                <p className="os-muted mt-1 line-clamp-2 text-xs">{task.description}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase text-os-muted">
                {(task.skills ?? []).slice(0, 3).map((skill) => (
                  <span key={skill} className="rounded-full bg-[var(--os-card)] px-2 py-0.5">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/projects/${task.project.id}`}
                  className="inline-flex min-h-9 items-center rounded-full bg-os-fg px-3 text-xs font-semibold text-os-bg"
                >
                  Open
                </Link>
                <Link
                  href={`/projects/${task.project.id}#tasks`}
                  className="inline-flex min-h-9 items-center rounded-full border border-os-border px-3 text-xs font-semibold"
                >
                  Bid
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </details>
  );
}
