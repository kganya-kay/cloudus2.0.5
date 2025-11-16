"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownTrayIcon, SparklesIcon } from "@heroicons/react/24/outline";

import { MarketplaceTasksPanel } from "~/app/_components/MarketplaceTasksPanel";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";

type CreatorMe = RouterOutputs["creator"]["me"];
type FeedItem = RouterOutputs["feed"]["list"]["items"][number];
type ContributorOverview = RouterOutputs["project"]["contributorOverview"];

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

export default function CreatorDashboardClient({
  initialProfile,
  recentFeed,
  workSummary,
}: {
  initialProfile: CreatorMe;
  recentFeed: FeedItem[];
  workSummary?: ContributorOverview | null;
}) {
  const utils = api.useUtils();
  const profile = initialProfile.profile;
  const earnings = initialProfile.earnings;

  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [tagline, setTagline] = useState(profile?.tagline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [website, setWebsite] = useState(profile?.website ?? "");
  const [skills, setSkills] = useState((profile?.skills ?? []).join(", "));
  const [focusAreas, setFocusAreas] = useState((profile?.focusAreas ?? []).join(", "));

  const upsertProfile = api.creator.upsertProfile.useMutation({
    onSuccess: async () => {
      await utils.creator.me.invalidate();
    },
  });

  const overviewQuery = api.project.contributorOverview.useQuery(undefined, {
    initialData: workSummary ?? undefined,
    refetchInterval: 90_000,
  });
  const contributorOverview = overviewQuery.data;
  const activeTasks = contributorOverview?.activeTasks ?? [];
  const payoutRequests = contributorOverview?.payoutRequests ?? [];
  const notifications = contributorOverview?.notifications ?? [];

  const creatorStats = useMemo(() => {
    const followerCount = profile?._count?.followers ?? 0;
    const followingCount = profile?._count?.following ?? 0;
    const postsCount = profile?._count?.feedPosts ?? 0;
    return { followerCount, followingCount, postsCount };
  }, [profile]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    upsertProfile.mutate({
      handle,
      displayName: displayName || "Cloudus Creator",
      tagline: tagline || undefined,
      bio: bio || undefined,
      website: website || undefined,
      socialLinks: website ? [website] : [],
      skills: skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      focusAreas: focusAreas
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Followers</p>
          <p className="text-3xl font-semibold text-gray-900">{creatorStats.followerCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Creator earnings</p>
          <p className="text-3xl font-semibold text-emerald-700">
            {formatCurrency(earnings?.availableCents ?? 0)}
          </p>
          <p className="text-xs text-gray-500">
            {formatCurrency(earnings?.lockedCents ?? 0)} pending approval
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Posts</p>
          <p className="text-3xl font-semibold text-gray-900">{creatorStats.postsCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Following</p>
          <p className="text-3xl font-semibold text-gray-900">{creatorStats.followingCount}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Profile</p>
            <h2 className="text-lg font-semibold text-gray-900">Looks great in the feed</h2>
          </div>
          <Link
            href="/feed"
            className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            Preview feed
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Handle</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 text-sm"
              placeholder="my-handle"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 text-sm"
              placeholder="Cloudus Creator"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Tagline</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 text-sm"
              placeholder="Creator of Cloudus experiences."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border px-3 py-2 text-sm"
              placeholder="Share what you build, collab on, or ship."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 text-sm"
              placeholder="https://"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Skills</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 text-sm"
              placeholder="Product, Media, Ops"
            />
            <p className="text-xs text-gray-500">Comma separated.</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Focus areas</label>
            <input
              value={focusAreas}
              onChange={(e) => setFocusAreas(e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 text-sm"
              placeholder="Laundry, Commerce, Logistics"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={upsertProfile.isPending}
              className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {upsertProfile.isPending ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Recent feed stories</p>
            <h2 className="text-lg font-semibold text-gray-900">Inspiration from the studio</h2>
          </div>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-700"
          >
            <SparklesIcon className="h-4 w-4" />
            Go to feed
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recentFeed.slice(0, 4).map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-blue-50 bg-blue-50/60 p-4 text-sm text-gray-700"
            >
              <p className="text-xs uppercase text-gray-500">{post.type.replaceAll("_", " ")}</p>
              <p className="text-base font-semibold text-gray-900">
                {post.title ?? post.project?.name ?? "Untitled drop"}
              </p>
              {post.caption && <p className="mt-1 text-gray-600 line-clamp-2">{post.caption}</p>}
              {post.project?.name && (
                <Link
                  href={`/projects/${post.project.id}`}
                  className="mt-2 inline-flex text-xs font-semibold text-blue-700"
                >
                  View project →
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Active tasks</p>
                <h2 className="text-lg font-semibold text-gray-900">Keep work moving</h2>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {overviewQuery.isLoading ? "Updating..." : `${activeTasks.length} tasks`}
              </span>
            </div>
            {activeTasks.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                No tasks assigned. Claim briefs from the marketplace to get started.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {activeTasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-2xl border border-blue-100 px-4 py-3 text-sm text-gray-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.project.name}</p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                        {task.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatCurrency(task.budgetCents)} budget
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link
                        href={`/projects/${task.project.id}#tasks`}
                        className="inline-flex items-center rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700"
                      >
                        Update progress
                      </Link>
                      {task.status === "BACKLOG" && (
                        <Link
                          href={`/projects/${task.project.id}#tasks`}
                          className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700"
                        >
                          Claim task
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm text-gray-700">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Payouts & requests</p>
            {payoutRequests.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">
                No payout requests in review. Submit from a task once you deliver work.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {payoutRequests.map((request) => (
                  <li key={request.id} className="rounded-2xl bg-white/80 p-3 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">{request.task.title}</p>
                    <p className="text-xs text-gray-500">{request.task.project.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(request.amountCents)} · {request.status.toLowerCase()}
                    </p>
                    <Link
                      href={`/projects/${request.task.project.id}#tasks`}
                      className="mt-2 inline-flex text-xs font-semibold text-emerald-700"
                    >
                      View task
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Notifications</p>
            <h2 className="text-lg font-semibold text-gray-900">Next steps</h2>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {notifications.length} alerts
          </span>
        </div>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No alerts right now. You&apos;ll see approvals, payout updates, and concierge notes
            here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="rounded-2xl border border-gray-100 bg-white/80 p-3 shadow-sm"
              >
                <p className="font-semibold text-gray-900">{notification.title}</p>
                <p className="text-xs text-gray-500">{notification.body}</p>
                {notification.link && (
                  <Link
                    href={notification.link}
                    className="mt-1 inline-flex text-xs font-semibold text-blue-700"
                  >
                    View details
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <MarketplaceTasksPanel
        role="CREATOR"
        limit={4}
        title="Marketplace reminders"
        subtitle="Claim new briefs while you wait for approvals."
      />

      <section className="rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-sm text-gray-600 shadow-sm">
        <p>
          Need help publishing? Email{" "}
          <a href="mailto:support@cloudusdigital.com" className="font-semibold text-blue-700">
            support@cloudusdigital.com
          </a>{" "}
          or drop your assets via{" "}
          <a href="/uploader" className="font-semibold text-blue-700">
            /uploader
          </a>
          .
        </p>
        <p className="mt-2">
          Download your latest payout breakdown{" "}
          <a
            href="/api/creators/earnings/export"
            className="inline-flex items-center gap-1 font-semibold text-blue-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            CSV
          </a>
        </p>
      </section>
    </div>
  );
}
