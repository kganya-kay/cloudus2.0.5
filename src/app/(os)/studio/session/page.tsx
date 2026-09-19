"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import { LiveStage } from "~/components/live/LiveStage";
import { Button, PageHeader } from "~/components/os/primitives";
import { api } from "~/trpc/react";

function asUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export default function StudioSessionPage() {
  const { data: session } = useSession();
  const [projectId, setProjectId] = useState<number | "">("");
  const [eventId, setEventId] = useState<number | "">("");
  const utils = api.useUtils();
  const mine = api.project.getAll.useQuery(undefined, { retry: false, enabled: Boolean(session?.user) });
  const projects = api.project.marketplace.useQuery({ limit: 40 }, { retry: false });
  const events = api.event.list.useQuery(
    { projectId: typeof projectId === "number" ? projectId : undefined, take: 20 },
    { retry: false },
  );
  const selectedEvent = api.event.select.useQuery(
    { id: typeof eventId === "number" ? eventId : 0 },
    { enabled: typeof eventId === "number", retry: false },
  );
  const selectedProject = api.project.select.useQuery(
    { id: typeof projectId === "number" ? projectId : 0 },
    { enabled: typeof projectId === "number", retry: false },
  );
  const goLive = api.live.goLive.useMutation({
    onSuccess: async () => {
      if (typeof eventId === "number") await utils.event.select.invalidate({ id: eventId });
      if (typeof projectId === "number") await utils.project.select.invalidate({ id: projectId });
    },
  });

  const project = selectedProject.data;
  const event = selectedEvent.data;
  const canHost = Boolean(
    session?.user?.id &&
      (project?.viewerContext?.isOwner || event?.viewerContext?.isHost || event?.viewerContext?.isOwner),
  );
  const streamUrl = event?.streamUrl ?? project?.heroVideo ?? null;
  const scope = event ? "EVENT" : "PROJECT";
  const scopeId = event ? String(event.id) : project ? String(project.id) : "";

  const projectOptions = useMemo(() => {
    const seen = new Map<number, { id: number; name: string }>();
    for (const item of [...(mine.data ?? []), ...(projects.data ?? [])]) {
      seen.set(item.id, { id: item.id, name: item.name });
    }
    return [...seen.values()];
  }, [mine.data, projects.data]);
  const eventOptions = events.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Room" actions={<Button href="/events" variant="secondary">Events</Button>} />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-xs text-os-muted">
          Project
          <select
            className="os-field"
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value ? Number(event.target.value) : "");
              setEventId("");
            }}
          >
            <option value="">Select</option>
            {projectOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-os-muted">
          Event
          <select
            className="os-field"
            value={eventId}
            onChange={(event) => setEventId(event.target.value ? Number(event.target.value) : "")}
          >
            <option value="">None</option>
            {eventOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {project ? (
        <LiveStage
          title={event?.name ?? project.name}
          scope={scope}
          scopeId={scopeId}
          projectId={project.id}
          streamUrl={streamUrl}
          canHost={canHost}
          savingStream={goLive.isPending}
          onSaveStream={(url) =>
            goLive.mutate({
              streamUrl: asUrl(url),
              eventId: event?.id,
              projectId: event ? undefined : project.id,
            })
          }
        />
      ) : (
        <p className="os-muted">Pick a project to go live.</p>
      )}
    </div>
  );
}
