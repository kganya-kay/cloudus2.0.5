"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  MusicalNoteIcon,
  NewspaperIcon,
  RectangleStackIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TvIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

import { api } from "~/trpc/react";
import { formatZarFromCents } from "~/lib/os/format";
import type { ServiceSlug } from "~/lib/revenue/catalog";
import { Button, Card } from "~/components/os/primitives";

const glyphs: Record<ServiceSlug, typeof WrenchScrewdriverIcon> = {
  build: WrenchScrewdriverIcon,
  studio: MusicalNoteIcon,
  blog: NewspaperIcon,
  shop: ShoppingBagIcon,
  rooms: SparklesIcon,
  events: CalendarDaysIcon,
  laundry: RectangleStackIcon,
  daily: TvIcon,
  market: BuildingStorefrontIcon,
};

export function HireDesk({ compact = false }: { compact?: boolean }) {
  const params = useSearchParams();
  const catalog = api.revenue.catalog.useQuery(undefined, { retry: false });
  const [slug, setSlug] = useState<ServiceSlug | null>(
    (params.get("s") as ServiceSlug | null) ?? null,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hire = api.revenue.hire.useMutation();

  const selected = useMemo(
    () => catalog.data?.find((item) => item.slug === slug) ?? catalog.data?.[0] ?? null,
    [catalog.data, slug],
  );

  const startPay = async (orderId: number) => {
    const response = await fetch("/api/payments/paystack/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = (await response.json().catch(() => null)) as
      | { checkoutUrl?: string; error?: string }
      | null;
    if (!response.ok || typeof data?.checkoutUrl !== "string") {
      throw new Error(data?.error ?? "Pay");
    }
    window.location.href = data.checkoutUrl;
  };

  const onHire = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const order = await hire.mutateAsync({
        slug: selected.slug,
        name: name.trim() || "Client",
        email: email.trim(),
        note: note.trim() || undefined,
      });
      await startPay(order.orderId);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Hire");
    }
  };

  const tiles = catalog.data ?? [];

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${compact ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-3 sm:grid-cols-5 lg:grid-cols-9"}`}>
        {tiles.map((item) => {
          const Icon = glyphs[item.slug];
          const active = (slug ?? selected?.slug) === item.slug;
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => setSlug(item.slug)}
              className={`os-card flex flex-col items-center gap-2 p-3 transition ${
                active ? "ring-2 ring-os-accent" : "hover:bg-os-elevated"
              }`}
              aria-label={item.name}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[11px] font-semibold">{formatZarFromCents(item.livePrice)}</span>
            </button>
          );
        })}
      </div>

      {!compact && selected ? (
        <Card>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void onHire();
            }}
          >
            <label className="sr-only" htmlFor="hire-name">
              Name
            </label>
            <input
              id="hire-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-2xl border border-os-border bg-os-elevated px-4 py-3"
              placeholder=" "
              required
            />
            <label className="sr-only" htmlFor="hire-email">
              Email
            </label>
            <input
              id="hire-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-os-border bg-os-elevated px-4 py-3"
              placeholder=" "
              required
            />
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="rounded-2xl border border-os-border bg-os-elevated px-4 py-3 sm:col-span-2"
              rows={3}
              placeholder=" "
            />
            <div className="flex items-center gap-3 sm:col-span-2">
              <Button type="submit" disabled={busy || !email}>
                {formatZarFromCents(selected.livePrice)}
              </Button>
              {error ? <span className="text-sm text-os-danger">{error}</span> : null}
            </div>
          </form>
        </Card>
      ) : null}

      {compact ? (
        <div className="flex justify-end">
          <Button href={selected ? `/hire?s=${selected.slug}` : "/hire"} size="sm">
            {selected ? formatZarFromCents(selected.livePrice) : "·"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
