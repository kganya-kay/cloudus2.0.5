"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
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
import { stackForService } from "~/lib/revenue/stack";
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

export function ServiceDesk({ compact = false }: { compact?: boolean }) {
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

  const book = api.revenue.hire.useMutation();

  const selected = useMemo(
    () => catalog.data?.find((item) => item.slug === slug) ?? catalog.data?.[0] ?? null,
    [catalog.data, slug],
  );

  const stack = stackForService(selected?.slug);

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

  const onBook = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const order = await book.mutateAsync({
        slug: selected.slug,
        name: name.trim() || "Client",
        email: email.trim(),
        note: note.trim() || undefined,
      });
      await startPay(order.orderId);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Book");
    }
  };

  const tiles = catalog.data ?? [];

  return (
    <div className="space-y-6">
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
              <span className="text-[11px] font-semibold">{item.name}</span>
              <span className="text-[11px] text-os-muted">{formatZarFromCents(item.livePrice)}</span>
            </button>
          );
        })}
      </div>

      {!compact && selected ? (
        <>
          <Card>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void onBook();
              }}
            >
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl border border-os-border bg-os-elevated px-4 py-3"
                placeholder="Organisation"
                required
                aria-label="Organisation"
              />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-2xl border border-os-border bg-os-elevated px-4 py-3"
                placeholder="Work email"
                required
                aria-label="Work email"
              />
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="rounded-2xl border border-os-border bg-os-elevated px-4 py-3 sm:col-span-2"
                rows={3}
                placeholder="Scope"
                aria-label="Scope"
              />
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" disabled={busy || !email}>
                  {formatZarFromCents(selected.livePrice)}
                </Button>
                {error ? <span className="text-sm text-os-danger">{error}</span> : null}
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            {stack.map((group) => (
              <motion.section
                key={group.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="os-card p-5"
              >
                <p className="os-kicker">{group.name}</p>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <li key={item.name}>
                      <p className="font-semibold">{item.name}</p>
                      <p className="os-muted text-sm">{item.use}</p>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>
        </>
      ) : null}

      {compact ? (
        <div className="flex justify-end">
          <Button href={selected ? `/services?s=${selected.slug}` : "/services"} size="sm">
            {selected ? selected.name : "Services"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
