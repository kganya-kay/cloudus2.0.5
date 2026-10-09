"use client";

import { api } from "~/trpc/react";
import { formatZarFromCents } from "~/lib/os/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonGrid,
} from "~/components/os/primitives";

export default function FounderPage() {
  const snapshot = api.workspace.founderSnapshot.useQuery(undefined, { retry: false });
  const pipeline = api.revenue.pipeline.useQuery(undefined, { retry: false });
  const utils = api.useUtils();
  const ensure = api.revenue.ensureStore.useMutation({
    onSuccess: () => void utils.revenue.catalog.invalidate(),
  });
  const pulse = api.revenue.pulse.useMutation({
    onSuccess: () => void utils.workspace.founderSnapshot.invalidate(),
  });
  const fulfill = api.revenue.fulfill.useMutation({
    onSuccess: () => void utils.revenue.pipeline.invalidate(),
  });

  if (snapshot.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Founder" />
        <SkeletonGrid />
      </div>
    );
  }

  if (snapshot.error) {
    return (
      <ErrorState
        title="Failed"
        onRetry={() => void snapshot.refetch()}
      />
    );
  }

  if (!snapshot.data?.allowed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Founder" />
        <EmptyState
          title="Locked"
          action={<Button href="/admin">Admin</Button>}
        />
      </div>
    );
  }

  const stats = [
    { label: "Orders today", value: snapshot.data.dailyOrders },
    { label: "Open orders", value: snapshot.data.openOrders },
    { label: "Closed orders", value: snapshot.data.closedOrders },
    { label: "Members", value: snapshot.data.totalUsers },
    { label: "Creators", value: snapshot.data.creators },
    { label: "Public projects", value: snapshot.data.publicProjects },
    { label: "Published notes", value: snapshot.data.publishedPosts },
    { label: "Shop items", value: snapshot.data.shopItems },
    { label: "Upcoming events", value: snapshot.data.upcomingEvents },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Founder"
        actions={
          <>
            <Button onClick={() => ensure.mutate()} disabled={ensure.isPending}>
              Store
            </Button>
            <Button onClick={() => pulse.mutate()} disabled={pulse.isPending} variant="secondary">
              Pulse
            </Button>
            <Button href="/admin" variant="ghost">
              Admin
            </Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label}>
            <p className="os-kicker">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="space-y-3">
          {(pipeline.data ?? []).map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-3 rounded-2xl bg-os-elevated p-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{order.name}</p>
                <p className="os-muted text-xs">
                  {order.slug ?? "·"} · {formatZarFromCents(order.price)} · {order.status}
                </p>
              </div>
              {order.paid ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => fulfill.mutate({ orderId: order.id })}
                  disabled={fulfill.isPending}
                >
                  ·
                </Button>
              ) : (
                <span className="text-xs text-os-muted">{formatZarFromCents(order.price)}</span>
              )}
            </div>
          ))}
          {!pipeline.data?.length ? <EmptyState title="—" /> : null}
        </div>
      </Card>
    </div>
  );
}
