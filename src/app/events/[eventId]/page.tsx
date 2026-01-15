"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
  BriefcaseIcon,
  BoltIcon,
  CurrencyDollarIcon,
  UsersIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/react";

const badgeClass =
  "inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-200";

const iconButtonClass =
  "flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400/60";

const getEmbedUrl = (value?: string | null) => {
  if (!value) return null;
  if (value.includes("youtube.com/embed/")) return value;
  const watchMatch = value.match(/v=([a-zA-Z0-9_-]+)/);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  const shortMatch = value.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }
  return value;
};

export default function EventDetailPage() {
  const params = useParams<{ eventId?: string }>();
  const parsedId = Number(params.eventId ?? 0);
  const [message, setMessage] = useState("");

  const eventQuery = api.event.select.useQuery({ id: parsedId }, { enabled: parsedId > 0 });
  const event = eventQuery.data;

  const projectId = event?.projectId ?? null;
  const projectQuery = api.project.select.useQuery(
    { id: projectId ?? 0 },
    { enabled: Boolean(projectId) },
  );
  const tasksQuery = api.project.tasks.useQuery(
    { projectId: projectId ?? 0 },
    { enabled: Boolean(projectId) },
  );

  const chatQuery = api.event.listChat.useQuery(
    { eventId: parsedId },
    { enabled: parsedId > 0 },
  );

  const utils = api.useUtils();
  const createChat = api.event.createChat.useMutation({
    onSuccess: async () => {
      setMessage("");
      await utils.event.listChat.invalidate({ eventId: parsedId });
    },
  });

  const stats = useMemo(() => {
    const taskTotal = tasksQuery.data?.length ?? 0;
    const contributorCount = projectQuery.data?._count?.contributors ?? 0;
    const shopItemCount = event?._count?.shopItems ?? 0;
    return { taskTotal, contributorCount, shopItemCount };
  }, [tasksQuery.data, projectQuery.data, event?._count?.shopItems]);

  const embedUrl = getEmbedUrl(event?.streamUrl ?? null);

  if (!parsedId) {
    return <p className="p-6 text-sm text-slate-400">Select an event to view.</p>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Activation</p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              {event?.name ?? "Event overview"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              {event?.description ??
                "Host live moments, capture content, and route contributor payouts from the linked project."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={badgeClass}>
                <CalendarDaysIcon className="h-4 w-4 text-emerald-300" />
                {event ? format(new Date(event.startAt), "EEE, MMM d h:mm a") : "Loading"}
              </span>
              <span className={badgeClass}>
                <MapPinIcon className="h-4 w-4 text-emerald-300" />
                {event?.location ?? "Location TBA"}
              </span>
              <span className={badgeClass}>
                <UserCircleIcon className="h-4 w-4 text-emerald-300" />
                {event?.host?.name ?? "Host"}
              </span>
              <span className={badgeClass}>
                <TicketIcon className="h-4 w-4 text-emerald-300" />
                {event?.status ?? "Scheduled"}
              </span>
            </div>
          </div>
          {projectId && (
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/70 px-4 py-2 text-xs font-semibold text-emerald-200"
            >
              Open project workspace
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40">
          <div className="aspect-video w-full bg-black">
            {embedUrl ? (
              <iframe
                title={event?.name ?? "Event stream"}
                src={embedUrl}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Add a stream link to show the event broadcast.
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-800 p-4 text-xs">
            <span className={iconButtonClass}>
              <BriefcaseIcon className="h-4 w-4 text-emerald-300" />
              {stats.taskTotal} tasks
            </span>
            <span className={iconButtonClass}>
              <UsersIcon className="h-4 w-4 text-emerald-300" />
              {stats.contributorCount} contributors
            </span>
            <span className={iconButtonClass}>
              <ShoppingBagIcon className="h-4 w-4 text-emerald-300" />
              {stats.shopItemCount} shop items
            </span>
            <Link href={projectId ? `/projects/${projectId}#bid` : "#"} className={iconButtonClass}>
              <BoltIcon className="h-4 w-4 text-emerald-300" />
              contribute
            </Link>
            <Link href={projectId ? `/projects/${projectId}#tasks` : "#"} className={iconButtonClass}>
              <CurrencyDollarIcon className="h-4 w-4 text-emerald-300" />
              payouts
            </Link>
            <span className={iconButtonClass}>
              <ChatBubbleLeftRightIcon className="h-4 w-4 text-emerald-300" />
              live chat
            </span>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Project actions</h2>
                {projectId && (
                  <Link
                    href={`/projects/${projectId}`}
                    className="text-xs font-semibold text-emerald-200"
                  >
                    View full project
                  </Link>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Event contributors earn from the linked project budget. Use these actions to
                participate, claim tasks, and track payouts.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Link href={projectId ? `/projects/${projectId}#bid` : "#"} className={iconButtonClass}>
                  <BoltIcon className="h-4 w-4 text-emerald-300" />
                  Submit a bid to contribute
                </Link>
                <Link href={projectId ? `/projects/${projectId}#tasks` : "#"} className={iconButtonClass}>
                  <BriefcaseIcon className="h-4 w-4 text-emerald-300" />
                  View tasks and payouts
                </Link>
                <Link href={projectId ? `/projects/${projectId}` : "#"} className={iconButtonClass}>
                  <UsersIcon className="h-4 w-4 text-emerald-300" />
                  Join the contributor roster
                </Link>
                <Link href={projectId ? `/projects/${projectId}` : "#"} className={iconButtonClass}>
                  <CurrencyDollarIcon className="h-4 w-4 text-emerald-300" />
                  Track budget and payments
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="text-lg font-semibold">Live chat feed</h2>
              <p className="mt-2 text-sm text-slate-300">
                Post updates from the venue or share links for collaborators.
              </p>
              <div className="mt-4 space-y-3">
                {chatQuery.data?.length ? (
                  chatQuery.data.map((post) => (
                    <div key={post.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-semibold text-slate-200">
                          {post.createdBy?.name ?? "Contributor"}
                        </span>
                        <span>{format(new Date(post.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">{post.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No chat posts yet.</p>
                )}
              </div>
              <form
                className="mt-4 flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!message.trim()) return;
                  createChat.mutate({ eventId: parsedId, message: message.trim() });
                }}
              >
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                  placeholder="Share a quick update from the event."
                />
                <button
                  type="submit"
                  disabled={createChat.isPending}
                  className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                >
                  {createChat.isPending ? "Posting..." : "Post to chat"}
                </button>
              </form>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Activation info
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>
                  Project:{" "}
                  <span className="text-slate-100">{event?.project?.name ?? "Loading"}</span>
                </p>
                <p>Venue: {event?.venue ?? "TBA"}</p>
                <p>Location: {event?.location ?? "TBA"}</p>
                <p>Status: {event?.status ?? "Scheduled"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Event shop items
              </h3>
              <div className="mt-4 space-y-3">
                {event?.shopItems?.length ? (
                  event.shopItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm">
                      <img
                        src={item.image ?? "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"}
                        alt={item.name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-400">Stock {item.stock}</p>
                      </div>
                      <Link
                        href={`/shop/item/${item.id}`}
                        className="text-xs font-semibold text-emerald-200"
                      >
                        View
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No shop items for this event yet.</p>
                )}
              </div>
              <Link
                href="/shop"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-200"
              >
                Browse shop
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
