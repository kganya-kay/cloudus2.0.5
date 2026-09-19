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
import { FeedOwn } from "~/components/os/feed-own";
import { Hint } from "~/components/os/hint";
import { OwnText } from "~/components/os/own-text";

import { useOnline } from "./use-online";

export function OsHome() {
  const { data: session, status } = useSession();
  const online = useOnline();
  const overview = api.workspace.overview.useQuery(undefined, { retry: false });
  const utils = api.useUtils();
  const updateCapture = api.workspace.updateCapture.useMutation({
    onSuccess: () => void utils.workspace.overview.invalidate(),
  });
  const deleteCapture = api.workspace.deleteCapture.useMutation({
    onSuccess: () => void utils.workspace.overview.invalidate(),
  });
  const userId = session?.user?.id;

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
        hint="Build, then open tonight’s room."
        actions={
          <>
            <Button href="/build">Build</Button>
            <Button href="/studio/session" variant="secondary">
              Session
            </Button>
          </>
        }
      />

      <section className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Next</h2>
            <Hint>Your next open task.</Hint>
          </div>
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
              <OwnText
                canManage
                text={parseCapture(recentCaptures[0].name).text}
                busy={updateCapture.isPending || deleteCapture.isPending}
                onSave={(text) =>
                  updateCapture.mutate({
                    id: recentCaptures[0]!.id,
                    kind: parseCapture(recentCaptures[0]!.name).kind,
                    text,
                  })
                }
                onDelete={() => deleteCapture.mutate({ id: recentCaptures[0]!.id })}
              />
              <Button href="/build" size="sm" variant="secondary">
                Open
              </Button>
            </div>
          ) : (
            <EmptyState title="Idle" action={<Button href="/projects" size="sm">Projects</Button>} />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Tonight</h2>
            <Hint>The next session on the floor.</Hint>
          </div>
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
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Pulse</h2>
            <Hint>{recentCaptures.length} notes in the room.</Hint>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="accent">{data?.projects.length ?? 0}</Badge>
            <Badge>{data?.creators.length ?? 0}</Badge>
          </div>
        </Card>
      </section>

      <section className="grid min-w-0 gap-4 md:grid-cols-2">
        <div className="os-card min-w-0 overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Projects</h2>
            <Link href="/projects" className="text-xs font-semibold text-os-accent">
              All
            </Link>
          </div>
          {data?.projects.length ? (
            <ul className="space-y-1">
              {data.projects.slice(0, 3).map((project) => (
                <li key={project.id} className="min-w-0">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex min-w-0 items-center gap-2.5 rounded-xl py-1.5"
                  >
                    <img src={project.image} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{project.name}</p>
                      <p className="os-muted truncate text-xs leading-4">{project.category ?? project.type}</p>
                    </div>
                    <Badge>{project.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="os-muted">None.</p>
              <Button href="/projects/create" size="sm">
                New
              </Button>
            </div>
          )}
        </div>

        <div className="os-card min-w-0 overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Room</h2>
            <Link href="/community" className="text-xs font-semibold text-os-accent">
              Open
            </Link>
          </div>
          {(data?.feed ?? []).length ? (
            <ul className="space-y-1">
              {(data?.feed ?? []).slice(0, 3).map((item) => (
                <li key={item.id} className="flex min-w-0 items-center gap-2.5 py-1.5">
                  <span className="shrink-0">
                    <Avatar
                      src={item.creator.avatarUrl ?? item.creator.user.image}
                      name={item.creator.displayName}
                      size="sm"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title ?? item.caption ?? "Update"}</p>
                    <p className="os-muted truncate text-xs leading-4">@{item.creator.handle}</p>
                    <FeedOwn
                      postId={item.id}
                      title={item.title}
                      caption={item.caption}
                      canManage={userId === item.creator.user.id}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="os-muted">Quiet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export function RevenueHint({ amount }: { amount?: number }) {
  return <span>{formatZarFromCents(amount ?? 0)}</span>;
}
