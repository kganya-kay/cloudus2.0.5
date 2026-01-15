"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/react";
import { Role } from "@prisma/client";

const iconClassName = "h-4 w-4 text-slate-600";

export default function EventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const utils = api.useUtils();
  const { data, isLoading } = api.event.list.useQuery();
  const projectsQuery = api.project.getAll.useQuery(undefined, {
    enabled: Boolean(session?.user),
  });
  const isAdmin = session?.user?.role === Role.ADMIN;
  const usersQuery = api.user.getAll.useQuery(undefined, {
    enabled: isAdmin,
  });
  const createEvent = api.event.create.useMutation({
    onSuccess: async (event) => {
      await utils.event.list.invalidate();
      router.push(`/events/${event.id}`);
    },
  });
  const events = data?.items ?? [];
  const projects = projectsQuery.data ?? [];

  const [formState, setFormState] = useState({
    name: "",
    description: "",
    projectId: "",
    hostId: "",
    startAt: "",
    endAt: "",
    location: "",
    venue: "",
    streamUrl: "",
  });

  const ownedProjects = useMemo(() => {
    const userId = session?.user?.id;
    if (!userId) return [];
    return projects.filter((project) => project.createdById === userId);
  }, [projects, session?.user?.id]);
  const selectableProjects = isAdmin ? projects : ownedProjects;
  const canCreateEvent = Boolean(session?.user?.id) && selectableProjects.length > 0;
  const projectOptions = useMemo(
    () => selectableProjects.map((project) => ({ id: project.id, name: project.name })),
    [selectableProjects],
  );
  const selectedProject = useMemo(() => {
    const id = Number(formState.projectId);
    if (!id) return null;
    return selectableProjects.find((project) => project.id === id) ?? null;
  }, [formState.projectId, selectableProjects]);
  const hostOptions = useMemo(() => {
    const users = usersQuery.data ?? [];
    return users.map((user) => ({
      id: user.id,
      label: user.name ?? user.email ?? user.id,
    }));
  }, [usersQuery.data]);

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
        <section className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Create an event</h2>
              <p className="mt-1 text-sm text-slate-300">
                Link an activation to a project so tasks, payouts, and contributors sync.
              </p>
            </div>
            {!session?.user?.id && (
              <Link
                href="/api/auth/signin"
                className="rounded-full border border-emerald-400/70 px-4 py-2 text-xs font-semibold text-emerald-200"
              >
                Sign in to create
              </Link>
            )}
          </div>

          {session?.user?.id && (
            <form
              className="mt-6 grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!canCreateEvent || createEvent.isPending) return;
                const hostId = session?.user?.id;
                const resolvedHostId = isAdmin
                  ? formState.hostId || selectedProject?.createdById || hostId
                  : hostId;
                if (!resolvedHostId) return;
                createEvent.mutate({
                  name: formState.name.trim(),
                  description: formState.description.trim() || undefined,
                  projectId: Number(formState.projectId),
                  hostId: resolvedHostId,
                  startAt: new Date(formState.startAt),
                  endAt: formState.endAt ? new Date(formState.endAt) : undefined,
                  location: formState.location.trim() || undefined,
                  venue: formState.venue.trim() || undefined,
                  streamUrl: formState.streamUrl.trim() || undefined,
                });
              }}
            >
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                placeholder="Event name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
              <select
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                value={formState.projectId}
                onChange={(event) => {
                  const nextProjectId = event.target.value;
                  const project = selectableProjects.find(
                    (item) => String(item.id) === nextProjectId,
                  );
                  setFormState((prev) => ({
                    ...prev,
                    projectId: nextProjectId,
                    hostId: project?.createdById ?? prev.hostId,
                  }));
                }}
                required
              >
                <option value="">Select project</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                value={formState.startAt}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, startAt: event.target.value }))
                }
                required
              />
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                value={formState.endAt}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, endAt: event.target.value }))
                }
              />
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                placeholder="Location"
                value={formState.location}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, location: event.target.value }))
                }
              />
              {isAdmin && (
                <select
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                  value={formState.hostId}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, hostId: event.target.value }))
                  }
                >
                  <option value="">Host (defaults to project owner)</option>
                  {hostOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.label}
                    </option>
                  ))}
                </select>
              )}
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100"
                placeholder="Venue"
                value={formState.venue}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, venue: event.target.value }))
                }
              />
              <input
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 md:col-span-2"
                placeholder="YouTube or livestream URL"
                value={formState.streamUrl}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, streamUrl: event.target.value }))
                }
              />
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 md:col-span-2"
                placeholder="Event description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
              />
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!canCreateEvent || createEvent.isPending}
                  className="w-full rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                >
                  {createEvent.isPending ? "Creating..." : "Create event"}
                </button>
                {!isAdmin && session?.user?.id && ownedProjects.length === 0 && (
                  <p className="mt-2 text-xs text-slate-400">
                    You can only create events for projects you own.{" "}
                    <Link href="/projects/create" className="text-emerald-200 underline">
                      Create a project
                    </Link>{" "}
                    to get started.
                  </p>
                )}
              </div>
            </form>
          )}
        </section>

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
