"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { api, type RouterOutputs } from "~/trpc/react";
import { formatZarFromCents } from "~/lib/os/format";
import { Badge, Button, EmptyState } from "~/components/os/primitives";

type ShopItemWithMeta = RouterOutputs["shopItem"]["getAll"][number];

function firstValidImage(primary: string | null | undefined, extras: string[] | undefined) {
  if (primary?.trim()) return primary;
  const extra = extras?.find((item) => item.trim().length > 0);
  return extra ?? "/cloudus-logo-final.png";
}

export default function AllShopItems({
  initialItems,
}: {
  initialItems?: ShopItemWithMeta[];
}) {
  const { status } = useSession();
  const utils = api.useUtils();
  const itemsQuery = api.shopItem.getAll.useQuery(undefined, {
    initialData: initialItems,
    retry: false,
  });
  const toggleLike = api.shopItem.toggleLike.useMutation({
    onSuccess: async () => {
      await utils.shopItem.getAll.invalidate();
    },
  });

  const items = itemsQuery.data ?? [];

  if (itemsQuery.isLoading && !initialItems) {
    return <p className="os-muted">Loading the shop…</p>;
  }

  if (itemsQuery.isError) {
    return (
      <EmptyState
        title="Shop could not load"
        description="The catalogue is public. If this keeps failing, Cloudus cannot reach the database."
        action={<Button onClick={() => void itemsQuery.refetch()}>Try again</Button>}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No items yet"
        description="Guests can browse this catalogue. Items appear here as soon as they are published."
      />
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <p className="os-muted">{items.length} {items.length === 1 ? "item" : "items"}</p>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const hero = firstValidImage(item.image, item.links);
          return (
            <li key={item.id} className="os-card overflow-hidden p-0">
              <img src={hero} alt={item.name} className="h-44 w-full object-cover" />
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="os-muted line-clamp-2">{item.description || "No description yet."}</p>
                  </div>
                  <Badge tone="accent">{formatZarFromCents(item.price)}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.type ? <Badge>{item.type}</Badge> : null}
                  <span className="text-xs text-os-muted">{item.ordersCount} orders</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button href={`/shop/item/${item.id}`} size="sm">
                    View
                  </Button>
                  <Button href={`/shop/orders/${item.id}`} size="sm" variant="secondary">
                    Order
                  </Button>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-os-muted"
                  onClick={() => {
                    if (status !== "authenticated") {
                      window.location.href = "/auth/login?callbackUrl=/shop";
                      return;
                    }
                    toggleLike.mutate({ itemId: item.id });
                  }}
                >
                  {item.userLiked ? "Liked" : "Like"} · {item.likesCount}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="os-muted mt-6 text-center">
        Supplier?{" "}
        <Link href="/suppliers/apply" className="font-semibold text-os-accent">
          Apply to list
        </Link>
      </p>
    </section>
  );
}
