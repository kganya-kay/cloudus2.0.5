"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { formatDateTime, formatZarFromCents, parseCapture } from "~/lib/os/format";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  OfflineBanner,
  PageHeader,
  SkeletonGrid,
} from "~/components/os/primitives";
import { useOnline } from "./use-online";

export function OsHome() {
  const { status } = useSession();
  const online = useOnline();
  const overview = api.workspace.overview.useQuery(undefined, { retry: false });

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Home" />
        <SkeletonGrid count={6} />
      </div>
    );
  }

  if (overview.error) {
    return (
      <ErrorState
        title="Failed"
        onRetry={() => void overview.refetch()}
      />
    );
  }

  const data = overview.data;
  const nextEvent = data?.nextBuildNight;
  const recentCaptures = (data?.captures ?? []).slice(0, 4);

  return (
    <div className="space-y-6">
      <OfflineBanner online={online} />
      <PageHeader
        title={status === "authenticated" ? "Home" : "Cloudus"}
        actions={
          <>
            <Button href="/build">Build</Button>
            <Button href="/studio/session" variant="secondary">
              Session
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Next</h2>
          {data?.assignedTasks[0] ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm">{data.assignedTasks[0].title}</p>
              <p className="os-muted">{data.assignedTasks[0].project.name}</p>
              <Button href={`/projects/${data.assignedTasks[0].project.id}`} size="sm">
                Open
              </Button>
            </div>
          ) : recentCaptures[0] ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm">{parseCapture(recentCaptures[0].name).text}</p>
              <Button href="/build" size="sm" variant="secondary">
                Open
              </Button>
            </div>
          ) : (
            <EmptyState title="Idle" action={<Button href="/projects" size="sm">Projects</Button>} />
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Tonight</h2>
          {nextEvent ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium">{nextEvent.name}</p>
              <p className="os-muted">
                {formatDateTime(nextEvent.startAt)} · {nextEvent.venue ?? nextEvent.location ?? "Cloudus HQ"}
              </p>
              <div className="flex gap-2">
                <Button href={`/events/${nextEvent.id}`} size="sm">
                  Event
                </Button>
                <Button href="/studio/session" size="sm" variant="ghost">
                  Room
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState title="No session" action={<Button href="/events" size="sm" variant="secondary">Events</Button>} />
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Pulse</h2>
          <p className="os-muted mt-3">{recentCaptures.length} notes</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="accent">{data?.projects.length ?? 0} projects</Badge>
            <Badge>{data?.creators.length ?? 0} creators</Badge>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link href="/projects" className="text-sm font-semibold text-os-accent">
              All
            </Link>
          </div>
          {data?.projects.length ? (
            <ul className="space-y-3">
              {data.projects.slice(0, 5).map((project) => (
                <li key={project.id}>
                  <Link href={`/projects/${project.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-os-elevated">
                    <img src={project.image} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{project.name}</p>
                      <p className="os-muted truncate">{project.category ?? project.type}</p>
                    </div>
                    <Badge>{project.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="None yet" action={<Button href="/projects/create" size="sm">New</Button>} />
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Room</h2>
            <Link href="/community" className="text-sm font-semibold text-os-accent">
              Open
            </Link>
          </div>
          <ul className="space-y-3">
            {(data?.feed ?? []).slice(0, 4).map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <Avatar
                  src={item.creator.avatarUrl ?? item.creator.user.image}
                  name={item.creator.displayName}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium">{item.title ?? item.caption ?? "Update"}</p>
                  <p className="os-muted">@{item.creator.handle}</p>
                </div>
              </li>
            ))}
          </ul>
          {!data?.feed.length ? (
            <p className="os-muted">Quiet.</p>
          ) : null}
        </Card>
      </section>
    </div>
  );
}

export function RevenueHint({ amount }: { amount?: number }) {
  return <span>{formatZarFromCents(amount ?? 0)}</span>;
}
