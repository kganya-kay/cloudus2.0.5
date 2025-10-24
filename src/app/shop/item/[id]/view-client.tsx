// src/app/shop/item/[id]/view-client.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, IconButton, Tooltip } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { api, type RouterOutputs } from "~/trpc/react";

type Item = RouterOutputs["shopItem"]["getById"];

function formatZAR(amountCents: number | null | undefined) {
  const rands = Math.round((amountCents ?? 0) / 100);
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

function gallery(item: Item | undefined) {
  const extras = item?.links ?? [];
  const list = [item?.image, ...extras].filter((s): s is string => !!s && s.length > 0);
  return list.length > 0
    ? list
    : [
        "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
               <rect width='100%' height='100%' fill='#f3f4f6'/>
               <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
                     font-family='Arial' font-size='20' fill='#9ca3af'>Cloudus · No image</text>
             </svg>`,
          ),
      ];
}

export default function Client({ id }: { id: number }) {
  const { data: item, isLoading } = api.shopItem.getById.useQuery({ id });
  const utils = api.useUtils();
  const toggleLike = api.shopItem.toggleLike.useMutation({
    onSuccess: async () => {
      await utils.shopItem.getById.invalidate({ id });
      await utils.shopItem.getAll.invalidate();
    },
  });

  const images = useMemo(() => gallery(item), [item]);
  const [activeIdx, setActiveIdx] = useState(0);

  if (isLoading) return <p className="text-center text-gray-500">Loading item…</p>;
  if (!item) return <p className="text-center text-gray-500">Item not found.</p>;

  const priceText = formatZAR(item.price);
  const orderHref = `/shop/orders/${item.id}`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/shop/item/${item.id}` : `/shop/item/${item.id}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: media gallery */}
      <section className="rounded-2xl border bg-white p-3">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl ring-1 ring-gray-200">
          <img src={images[activeIdx]} alt={item.name} className="h-full w-full object-cover" />
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={`${item.id}-g-${i}`}
                onClick={() => setActiveIdx(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-md ring-2 ${i === activeIdx ? "ring-blue-500" : "ring-gray-200"}`}
                aria-label={`Preview ${i + 1}`}
              >
                <img src={src} alt={`${item.name} ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Right: details + CTA */}
      <section className="flex flex-col gap-4 rounded-2xl border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            {item.supplier && (
              <p className="mt-1 text-xs text-gray-500">
                Supplied by <span className="font-medium">{item.supplier.name}</span>
                {item.supplier.city ? ` • ${item.supplier.city}` : ""}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="rounded-full bg-blue-600/90 px-3 py-1 text-sm font-semibold text-white shadow">{priceText}</div>
            {item.type && (
              <div className="mt-1 text-xs text-gray-500">{item.type}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip title={((item as unknown as { userLiked?: boolean }).userLiked ?? false) ? "Unlike" : "Like"}>
            <IconButton
              onClick={() => toggleLike.mutate({ itemId: item.id })}
              size="small"
              className={((item as unknown as { userLiked?: boolean }).userLiked ?? false) ? "!text-rose-600" : "!text-gray-600"}
            >
              <FavoriteIcon />
            </IconButton>
          </Tooltip>
          <span className="text-xs text-gray-500">{(item as unknown as { likesCount?: number }).likesCount ?? 0} likes</span>

          <Tooltip title="Copy link">
            <IconButton
              size="small"
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
              className="!text-gray-600"
            >
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button href={orderHref} variant="contained" className="!flex-1 !rounded-full !bg-blue-600 !py-3 !text-white hover:!bg-blue-700">
            Order Now
          </Button>
          <Button
            href={`https://wa.me/27640204765?text=${encodeURIComponent(
              `Hi Cloudus! I'm interested in "${item.name}" (id ${item.id}).`,
            )}`}
            variant="outlined"
            className="!flex-1 !rounded-full"
            startIcon={<WhatsAppIcon />}
          >
            Chat on WhatsApp
          </Button>
        </div>

        {/* Trust row */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-2 text-center">Secure checkout</div>
          <div className="rounded-lg bg-gray-50 p-2 text-center">Fast support</div>
          <div className="rounded-lg bg-gray-50 p-2 text-center">Trusted suppliers</div>
          <div className="rounded-lg bg-gray-50 p-2 text-center">Delivery options</div>
        </div>
      </section>

      {/* Full width: more details */}
      <section className="lg:col-span-2">
        <div className="mt-4 rounded-2xl border bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-800">About this item</h2>
          <p className="text-sm leading-6 text-gray-700">{item.description}</p>
        </div>
      </section>
    </div>
  );
}
