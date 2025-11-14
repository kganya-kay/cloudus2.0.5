"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

function formatRands(cents?: number | null) {
  const r = Math.round((cents ?? 0) / 100);
  return `R ${r}`;
}

export default function LaundryDetails() {
  const { data } = api.supplier.list.useQuery({ onlyActive: true, page: 1, pageSize: 50 });
  const items = data?.items ?? [];
  const priceCandidates = items
    .map((s) => s.pricePerKg)
    .filter((v): v is number => typeof v === "number");
  const bestPrice = priceCandidates.length > 0 ? Math.min(...priceCandidates) : undefined;

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cloudus Laundry</h2>
          <p className="text-sm text-gray-600">Fast, reliable laundry with pickup and delivery options.</p>
        </div>
        {bestPrice != null && (
          <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
            From {formatRands(bestPrice)}/kg
          </span>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Wash, dry, fold, and pressing available</li>
          <li>• Estimated weight at drop-off; confirmed at processing</li>
          <li>• SMS/WhatsApp updates and pickup reminders</li>
        </ul>
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
          <p className="font-semibold">How it works</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Place an order online</li>
            <li>We confirm supplier and ETA</li>
            <li>Track progress and pay on delivery</li>
          </ol>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/laundry" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Order Laundry
        </Link>
        <Link href="/laundry#track" className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">
          Track & FAQs
        </Link>
      </div>
    </section>
  );
}
