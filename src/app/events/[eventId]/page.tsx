"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

import { LiveStage } from "~/components/live/LiveStage";
import { Button, PageHeader } from "~/components/os/primitives";
import { formatDateTime } from "~/lib/os/format";
import { api } from "~/trpc/react";

function asUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export default function EventDetailPage() {
  const params = useParams<{ eventId?: string }>();
  const parsedId = Number(params.eventId ?? 0);
  const { data: session } = useSession();
  const utils = api.useUtils();
  const eventQuery = api.event.select.useQuery({ id: parsedId }, { enabled: parsedId > 0, retry: false });
  const event = eventQuery.data;
  const updateEvent = api.event.update.useMutation({
    onSuccess: async () => {
      await utils.event.select.invalidate({ id: parsedId });
    },
  });

  const canHost =
    session?.user?.role === Role.ADMIN ||
    Boolean(event?.viewerContext?.isOwner) ||
    Boolean(event?.viewerContext?.isHost);

  if (!parsedId) {
    return <p className="os-muted">None.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={event?.name ?? "Event"}
        actions={
          event?.projectId ? (
            <Button href={`/projects/${event.projectId}`} variant="secondary">
              Project
            </Button>
          ) : null
        }
      />
      <p className="os-muted">
        {event ? `${formatDateTime(event.startAt)} · ${event.venue ?? event.location ?? "Room"}` : "…"}
      </p>
      <LiveStage
        title={event?.name ?? "Event"}
        scope="EVENT"
        scopeId={String(parsedId)}
        projectId={event?.projectId}
        streamUrl={event?.streamUrl}
        canHost={canHost}
        savingStream={updateEvent.isPending}
        onSaveStream={(url) =>
          updateEvent.mutate({
            id: parsedId,
            data: { streamUrl: asUrl(url), status: "Live" },
          })
        }
      />
    </div>
  );
}
