"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/react";

const iconClassName = "h-4 w-4 text-slate-600";

export default function EventsPage() {
  const { data, isLoading } = api.event.list.useQuery();
  const events = data?.items ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-14">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Events</p>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
            Local activations with live content drops.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Each event is linked to a project budget with tasks, payouts, and creator
            collaboration built in. Tap into the activation and join the build.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
            No events yet. Create one from a project to start hosting activations.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group rounded-3xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-emerald-400/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-300">
                      {event.status}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      {event.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300">
                      {event.project?.name ?? "Linked project"}
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                    {format(new Date(event.startAt), "MMM d")}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className={iconClassName} />
                    <span>{format(new Date(event.startAt), "EEE, MMM d h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className={iconClassName} />
                    <span>{event.location ?? "TBA"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCircleIcon className={iconClassName} />
                    <span>{event.host?.name ?? "Host"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBagIcon className={iconClassName} />
                    <span>{event.shopItemCount} items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChatBubbleLeftRightIcon className={iconClassName} />
                    <span>{event.chatCount} chat posts</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
