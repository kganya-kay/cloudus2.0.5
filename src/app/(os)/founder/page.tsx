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
        <PageHeader title="Founder console" description="Loading operating numbers." />
        <SkeletonGrid />
      </div>
    );
  }

  if (snapshot.error) {
    return (
      <ErrorState
        title="Session expired or request failed"
        description="Sign in again if your session ended. Founder numbers stay behind existing role checks."
        onRetry={() => void snapshot.refetch()}
      />
    );
  }

  if (!snapshot.data?.allowed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Founder console" description="This room is for Cloudus operators." />
        <EmptyState
          title="Permission required"
          description="Admin and caretaker roles keep using the existing /admin console. Nothing here bypasses RBAC."
          action={<Button href="/admin">Open admin</Button>}
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
        eyebrow="Founder mode"
        title="Operating console"
        description="A calm view of community, commerce, and launches. Fulfilment still happens in admin, shop, and project payment routes."
        actions={<Button href="/admin" variant="secondary">Admin ops</Button>}
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
