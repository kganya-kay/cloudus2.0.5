"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { Role } from "@prisma/client";
import { api } from "~/trpc/react";
import { Button, Card, EmptyState, PageHeader } from "~/components/os/primitives";

export default function EventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const utils = api.useUtils();
  const { data, isLoading } = api.event.list.useQuery();
  const projectsQuery = api.project.getAll.useQuery(undefined, {
    enabled: Boolean(session?.user),
  });
  const isAdmin = session?.user?.role === Role.ADMIN;
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
  const projectOptions = selectableProjects.map((project) => ({ id: project.id, name: project.name }));
  const selectedProject = selectableProjects.find((project) => project.id === Number(formState.projectId));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        actions={<Button href="/studio/session" variant="secondary">Room</Button>}
      />

      <Card>
        <h2 className="text-lg font-semibold">New</h2>
        {!session?.user?.id ? (
          <Button href="/auth/login" className="mt-4" size="sm">Sign in</Button>
        ) : (
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canCreateEvent || createEvent.isPending) return;
              const hostId = isAdmin
                ? formState.hostId || selectedProject?.createdById || session.user?.id
                : session.user?.id;
              if (!hostId) return;
              createEvent.mutate({
                name: formState.name.trim(),
                description: formState.description.trim() || undefined,
                projectId: Number(formState.projectId),
                hostId,
                startAt: new Date(formState.startAt),
                endAt: formState.endAt ? new Date(formState.endAt) : undefined,
                location: formState.location.trim() || undefined,
                venue: formState.venue.trim() || undefined,
                streamUrl: formState.streamUrl.trim() || undefined,
              });
            }}
          >
            <input className="os-field" placeholder="Event name" value={formState.name} onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))} required />
            <select className="os-field" value={formState.projectId} onChange={(e) => setFormState((p) => ({ ...p, projectId: e.target.value }))} required>
              <option value="">Select project</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            <input type="datetime-local" className="os-field" value={formState.startAt} onChange={(e) => setFormState((p) => ({ ...p, startAt: e.target.value }))} required />
            <input type="datetime-local" className="os-field" value={formState.endAt} onChange={(e) => setFormState((p) => ({ ...p, endAt: e.target.value }))} />
            <input className="os-field" placeholder="Location" value={formState.location} onChange={(e) => setFormState((p) => ({ ...p, location: e.target.value }))} />
            <input className="os-field" placeholder="Venue" value={formState.venue} onChange={(e) => setFormState((p) => ({ ...p, venue: e.target.value }))} />
            <input className="os-field md:col-span-2" placeholder="Livestream URL" value={formState.streamUrl} onChange={(e) => setFormState((p) => ({ ...p, streamUrl: e.target.value }))} />
            <textarea className="os-field md:col-span-2" rows={3} placeholder="Description" value={formState.description} onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))} />
            <div className="md:col-span-2">
              <Button type="submit" disabled={!canCreateEvent || createEvent.isPending}>
                {createEvent.isPending ? "…" : "Create"}
              </Button>
              {!isAdmin && ownedProjects.length === 0 ? (
                <p className="os-muted mt-2">Need a project first.</p>
              ) : null}
            </div>
          </form>
        )}
      </Card>

      {isLoading ? (
        <p className="os-muted">…</p>
      ) : events.length === 0 ? (
        <EmptyState title="None" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="h-full hover:bg-os-elevated">
                <p className="os-kicker">{event.status}</p>
                <h2 className="mt-2 text-lg font-semibold">{event.name}</h2>
                <p className="os-muted">{event.project?.name ?? "Linked project"}</p>
                <p className="os-muted mt-3">{format(new Date(event.startAt), "EEE, d MMM · h:mm a")}</p>
                <p className="os-muted">{event.location ?? "Location TBC"} · {event.host?.name ?? "Host"}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
