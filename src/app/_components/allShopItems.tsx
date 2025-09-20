"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button, Chip, IconButton, Tooltip } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { api, type RouterOutputs } from "~/trpc/react";

type ShopItemWithMeta = RouterOutputs["shopItem"]["getAll"][number];

/** Format price for South Africa (ZAR). */
function formatZAR(amountCents: number) {
  const rands = Math.round(amountCents / 100);
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(rands);
  } catch {
    return `R ${rands}`;
  }
}

/** First usable image (primary, then extras) with a safe placeholder. */
function firstValidImage(
  primary: string | null | undefined,
  extras: string[] | undefined,
) {
  const candidates: string[] = [];
  if (primary) candidates.push(primary);
  if (extras) candidates.push(...extras.filter(Boolean));
  return (
    candidates[0] ??
    "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
           <rect width='100%' height='100%' fill='#f3f4f6'/>
           <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
                 font-family='Arial' font-size='20' fill='#9ca3af'>Cloudus · Image</text>
         </svg>`,
      )
  );
}

/** Convert backend fields into storefront badges. */
function computeBadges(p: ShopItemWithMeta): string[] {
  const badges: string[] = [];
  if (p.type) badges.push(p.type); // "Product" | "Service" | etc.
  return badges;
}

export default function AllShopItems() {
  // Let tRPC infer types — no generics here
  const [allShopItems] = api.shopItem.getAll.useSuspenseQuery();
  const utils = api.useUtils();
  const toggleLike = api.shopItem.toggleLike.useMutation({
    onSuccess: async () => {
      // simplest: just refetch
      await utils.shopItem.getAll.invalidate();
    },
  });

  const items = useMemo(
    () =>
      allShopItems.map((p) => {
        const hero = firstValidImage(p.image, p.links);
        const thumbs = (p.links ?? []).slice(0, 3).filter(Boolean);
        return {
          ...p,
          _hero: hero,
          _thumbs: thumbs,
          badges: computeBadges(p),
        };
      }),
    [allShopItems],
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Cloudus Shop</h2>
          <p className="mt-1 text-sm text-gray-600">
            Hardware, software, and professional services — all powered by Cloudus.
          </p>
        </div>

        <Chip
          label={`${items.length} ${items.length === 1 ? "item" : "items"}`}
          color="primary"
          variant="outlined"
          className="!border-blue-500 !text-blue-600"
        />
      </header>

      {/* Grid */}
      <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:shadow-lg"
          >
            {/* Media */}
            <div className="relative">
              <img
                src={item._hero}
                alt={item.name}
                className="h-56 w-full object-cover transition will-change-transform group-hover:scale-[1.02]"
              />

              {/* Price pill */}
              <div className="absolute left-3 top-3 rounded-full bg-blue-600/90 px-3 py-1 text-xs font-semibold text-white shadow">
                {formatZAR(item.price)}
              </div>

              {/* Badges */}
              <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1">
                {item.badges.map((b) => (
                  <span
                    key={`${item.id}-${b}`}
                    className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 p-4">
              {/* Title + Stock + Actions */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{item.name}</h3>

                <div className="flex items-center gap-1">
                  {/* Like */}
                  <Tooltip title={item.userLiked ? "Unlike" : "Like"}>
                    <IconButton
                      size="small"
                      onClick={() => toggleLike.mutate({ itemId: item.id })}
                      className={item.userLiked ? "!text-rose-600" : "!text-gray-600"}
                    >
                      <FavoriteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <span className="text-xs text-gray-500">{item.likesCount}</span>

                  {/* Share */}
                  <Tooltip title="Copy link">
                    <IconButton
                      size="small"
                      onClick={() =>
                        void navigator.clipboard.writeText(
                          `${window.location.origin}/shop/item/${item.id}`,
                        )
                      }
                      className="!text-gray-600"
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between">
                {Number.isFinite(item.count) && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    {item.count} in stock
                  </span>
                )}
                <span className="text-xs text-gray-400">{item.ordersCount} orders</span>
              </div>

              <p className="line-clamp-2 text-sm text-gray-600">
                {item.description || "No description provided."}
              </p>

              {/* Thumbnails */}
              {item._thumbs.length > 0 && (
                <div className="mt-1 flex gap-2">
                  {item._thumbs.map((src, i) => (
                    <img
                      key={`${item.id}-thumb-${i}`}
                      src={src}
                      alt={`${item.name} preview ${i + 1}`}
                      className="h-14 w-14 rounded-md object-cover ring-1 ring-gray-200"
                    />
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="mt-1 grid grid-cols-3 gap-2">
                <Button
                  href={`/shop/orders/${item.id}`}
                  variant="contained"
                  className="!rounded-xl !bg-blue-600 !py-2 !text-white hover:!bg-blue-700"
                >
                  Order
                </Button>
                <Button href={`/shop/item/${item.id}`} variant="outlined" className="!rounded-xl">
                  Details
                </Button>
                <Button
                  href={`https://wa.me/27640204765?text=${encodeURIComponent(
                    `Hi Cloudus! I'm interested in "${item.name}" (id ${item.id}).`,
                  )}`}
                  variant="outlined"
                  className="!rounded-xl"
                  startIcon={<WhatsAppIcon />}
                >
                  Chat
                </Button>
              </div>
            </div>

            {/* Subtle gradient hover border */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-blue-400/40" />
          </li>
        ))}
      </ul>

      {/* Marketplace banner */}
      <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 text-center ring-1 ring-blue-100">
        <p className="text-sm text-gray-700">
          Are you a supplier? Join the <span className="font-semibold">Cloudus Marketplace</span> to
          list your products or services and reach more customers.{" "}
          <Link href="/suppliers/apply" className="text-blue-700 underline hover:text-blue-800">
            Apply now
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
