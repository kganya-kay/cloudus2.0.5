"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { formatDateTime } from "~/lib/os/format";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonGrid,
} from "~/components/os/primitives";
import { SocialMediaDrop } from "~/components/social/SocialMediaDrop";

export default function StudioPage() {
  const overview = api.workspace.overview.useQuery(undefined, { retry: false });

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Studio" description="Loading sessions and collaborators." />
        <SkeletonGrid />
      </div>
    );
  }

  if (overview.error) {
    return <ErrorState onRetry={() => void overview.refetch()} />;
  }

  const data = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Creative workspace"
        title="Studio"
        description="Music, design, video, and AI experiments share one room. Sessions first. Assets and collaborators next."
        actions={
          <>
            <Button href="/studio/session">Start Build Night</Button>
            <Button href="/events" variant="secondary">
              All events
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sessions</h2>
            <Badge tone="accent">Live-ready</Badge>
          </div>
          {data?.events.length ? (
            <ul className="mt-4 space-y-3">
              {data.events.map((event) => (
                <li key={event.id} className="rounded-2xl bg-os-elevated p-3">
                  <p className="font-medium">{event.name}</p>
                  <p className="os-muted">
                    {formatDateTime(event.startAt)} · {event.host.name ?? "Host"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button href={`/events/${event.id}`} size="sm" variant="secondary">
                      Details
                    </Button>
                    <Button href="/studio/session" size="sm" variant="ghost">
                      Room
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No sessions scheduled"
              description="Use the room anyway. The recap becomes this week's story."
              action={<Button href="/studio/session" size="sm">Open empty room</Button>}
            />
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Collaborators</h2>
          {data?.creators.length ? (
            <ul className="mt-4 space-y-3">
              {data.creators.map((creator) => (
                <li key={creator.id} className="flex items-center gap-3">
                  <Avatar src={creator.avatarUrl ?? creator.user.image} name={creator.displayName} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{creator.displayName}</p>
                    <p className="os-muted truncate">{creator.tagline ?? creator.skills[0] ?? creator.tier}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Invite two people"
              description="That is enough for a Friday Build Night."
              action={<Button href="/community" size="sm" variant="secondary">Find builders</Button>}
            />
          )}
        </Card>
      </section>

      <SocialMediaDrop
        kind="IMAGE"
        label="Drop latest social image"
        description="Reusable Cloudus drop. Connect one social on first run, then fetch the latest public post in the background."
      />

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Inspiration</h2>
          <Link href="/feed" className="text-sm font-semibold text-os-accent">
            Open feed
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(data?.feed ?? []).slice(0, 4).map((item) => (
            <article key={item.id} className="rounded-2xl bg-os-elevated p-4">
              <p className="text-sm font-medium">{item.title ?? item.caption ?? "Studio note"}</p>
              <p className="os-muted mt-1">@{item.creator.handle}</p>
            </article>
          ))}
        </div>
        {!data?.feed.length ? (
          <p className="os-muted mt-4">Share a snippet from FL Studio or a weekend tool.</p>
        ) : null}
      </Card>
    </div>
  );
}
