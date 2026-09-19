"use client";

import { api } from "~/trpc/react";
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
        actions={<Button href="/admin" variant="secondary">Admin</Button>}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.label}>
            <p className="os-kicker">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
