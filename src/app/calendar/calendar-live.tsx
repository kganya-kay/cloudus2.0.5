"use client";

import { LiveStage } from "~/components/live/LiveStage";
import { api } from "~/trpc/react";

export function CalendarLive() {
  const events = api.event.list.useQuery({ take: 12 }, { retry: false });
  const live = (events.data?.items ?? []).find((item) => item.streamUrl) ?? events.data?.items?.[0];
  const detail = api.event.select.useQuery(
    { id: live?.id ?? 0 },
    { enabled: Boolean(live?.id), retry: false },
  );

  if (!live) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <LiveStage
        title={live.name}
        scope="EVENT"
        scopeId={String(live.id)}
        projectId={detail.data?.projectId ?? live.projectId}
        streamUrl={detail.data?.streamUrl ?? live.streamUrl}
        canHost={Boolean(detail.data?.viewerContext?.isHost || detail.data?.viewerContext?.isOwner)}
      />
    </div>
  );
}
