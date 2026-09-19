"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { formatZarFromCents } from "~/lib/os/format";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonGrid,
} from "~/components/os/primitives";

export default function MarketplacePage() {
  const overview = api.workspace.overview.useQuery(undefined, { retry: false });

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Marketplace" />
        <SkeletonGrid />
      </div>
    );
  }

  if (overview.error) {
    return <ErrorState onRetry={() => void overview.refetch()} />;
  }

  const shop = overview.data?.shop ?? [];
  const rooms = overview.data?.rooms ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        actions={
          <>
            <Button href="/shop">Shop</Button>
            <Button href="/laundry" variant="secondary">
              Laundry
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/shop", label: "Shop" },
          { href: "/rooms", label: "Rooms" },
          { href: "/laundry", label: "Laundry" },
          { href: "/projects", label: "Projects" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="os-card p-4 hover:bg-os-elevated">
            <p className="font-semibold">{item.label}</p>
          </Link>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shop</h2>
          <Link href="/shop" className="text-sm font-semibold text-os-accent">
            All
          </Link>
        </div>
        {shop.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {shop.map((item) => (
              <Link key={item.id} href={`/shop/${item.id}`} className="rounded-2xl bg-os-elevated p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{item.name}</p>
                  <Badge tone="accent">{formatZarFromCents(item.price)}</Badge>
                </div>
                <p className="os-muted mt-2 line-clamp-2">{item.description}</p>
                <p className="mt-2 text-xs text-os-muted">{item.type}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Empty" action={<Button href="/shop" size="sm">Shop</Button>} />
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rooms</h2>
          <Link href="/rooms" className="text-sm font-semibold text-os-accent">
            Rentals
          </Link>
        </div>
        {rooms.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {rooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`} className="rounded-2xl bg-os-elevated p-3">
                <p className="font-medium">{room.title}</p>
                <p className="os-muted">
                  {room.address?.city ?? "South Africa"} · {formatZarFromCents(room.nightlyRateCents)} / night
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="None" />
        )}
      </Card>
    </div>
  );
}
