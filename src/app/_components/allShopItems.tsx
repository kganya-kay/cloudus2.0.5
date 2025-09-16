"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button, Chip } from "@mui/material";
import { api } from "~/trpc/react";

/**
 * Format price for South Africa (ZAR).
 */
function formatZAR(amount: number | null | undefined) {
  if (amount == null) return "R —";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `R ${amount}`;
  }
}

/**
 * Pick the first usable image (primary, then extras). Falls back to a neutral placeholder.
 */
function firstValidImage(primary?: string | null, extras?: string[]) {
  const candidates = [primary, ...(extras ?? [])].filter(Boolean) as string[];
  return (
    candidates[0] ??
    // simple light placeholder — replace with your brand image if you want
    "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
           <rect width='100%' height='100%' fill='#f3f4f6'/>
           <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
                 font-family='Arial' font-size='20' fill='#9ca3af'>Cloudus · Image</text>
         </svg>`
      )
  );
}

/**
 * Optional: convert backend "type" / "api" into a clean badge.
 * Examples:
 *  - type: "Service" -> "Service"
 *  - type: "Product" -> "Product"
 *  - api present (community/partner listing) -> "Community Supplier"
 */
function computeBadges(p: any): string[] {
  const badges: string[] = [];
  if (p?.type) badges.push(String(p.type));
  if (p?.api) badges.push("Community Supplier");
  return badges;
}

export default function AllShopItems() {
  // ✅ Let TRPC infer the exact return type (no generic here)
  const [allShopItems] = api.shopItem.getAll.useSuspenseQuery();

  // Build a lightweight view model strictly for rendering the UI
  const items = useMemo(
    () =>
      (allShopItems ?? []).map((p: any) => {
        const hero = firstValidImage(p.image, p.links);
        const thumbs = (p.links ?? []).slice(0, 3).filter(Boolean);
        return {
          id: p.id as string | number,
          name: p.name as string,
          description: (p.description as string) ?? "",
          price: p.price as number,
          image: p.image as string | null,
          links: p.links as string[] | undefined,
          count: (p.count as number) ?? null, // stock qty if you track it
          badges: computeBadges(p),
          _hero: hero,
          _thumbs: thumbs,
        };
      }),
    [allShopItems]
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Cloudus Shop
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Hardware, software, and professional services — plus community-supplier
            offerings — all powered by Cloudus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Chip
            label={`${items.length} ${items.length === 1 ? "item" : "items"}`}
            color="primary"
            variant="outlined"
            className="!border-blue-500 !text-blue-600"
          />
        </div>
      </header>

      {/* Grid */}
      <ul
        role="list"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
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

              {/* Badges (type, community supplier, etc.) */}
              <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1">
                {item.badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
                  {item.name}
                </h3>
                {/* Optional stock chip */}
                {item.count != null && (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    {item.count} in stock
                  </span>
                )}
              </div>

              <p className="line-clamp-2 text-sm text-gray-600">
                {item.description || "No description provided."}
              </p>

              {/* Thumbnails */}
              {!!item._thumbs.length && (
                <div className="mt-1 flex gap-2">
                  {item._thumbs.map((src: string | undefined, i: number) => (
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
              <div className="mt-1 grid grid-cols-2 gap-2">
                <Button
                  component={Link as any}
                  href={`/shop/orders/${item.id}`}
                  variant="contained"
                  className="!rounded-xl !bg-blue-600 !py-2 !text-white hover:!bg-blue-700"
                >
                  Order now
                </Button>
                <Button
                  component={Link as any}
                  href={`/shop/item/${item.id}`}
                  variant="outlined"
                  className="!rounded-xl"
                >
                  Details
                </Button>
              </div>
            </div>

            {/* Subtle gradient hover border */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-blue-400/40" />
          </li>
        ))}
      </ul>

      {/* Marketplace footer banner */}
      <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 text-center ring-1 ring-blue-100">
        <p className="text-sm text-gray-700">
          Are you a supplier? Join the{" "}
          <span className="font-semibold">Cloudus Marketplace</span> to list your
          products or services and reach more customers.{" "}
          <Link
            href="/suppliers/apply"
            className="text-blue-700 underline hover:text-blue-800"
          >
            Apply now
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
