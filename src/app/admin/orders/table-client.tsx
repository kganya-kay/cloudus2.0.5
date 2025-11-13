// src/app/admin/orders/table-client.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import type { FulfilmentStatus } from "@prisma/client";
import { api } from "~/trpc/react";
import { StatusBadge } from "../_components/StatusBadge";

const STATUSES = [
  "ALL",
  "NEW",
  "SOURCING_SUPPLIER",
  "SUPPLIER_CONFIRMED",
  "IN_PROGRESS",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CLOSED",
  "CANCELED",
] as const;

export default function TableClient() {
  const [q, setQ] = useState("");
  type Status = (typeof STATUSES)[number];
  const [status, setStatus] = useState<Status>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const isFulfilmentStatus = (s: Status): s is FulfilmentStatus => s !== "ALL";
  const { data, isLoading } = api.order.list.useQuery({
    q: q.trim() || undefined,
    status: isFulfilmentStatus(status) ? status : undefined,
    page,
    pageSize,
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;

  type OrderRow = NonNullable<typeof data>["items"][number];
  const rows: OrderRow[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
        <form
          className="flex w-full max-w-xl items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search code, name, phone, area"
            className="flex-1 rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Status);
              setPage(1);
            }}
            className="rounded-full border px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <button className="rounded-full border px-4 py-2 text-sm">Apply</button>
        </form>

        <div className="flex items-center gap-2 text-sm">
          <button
            className="rounded-full border px-3 py-1 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-gray-600">
            Page {page} / {totalPages}
          </span>
          <button
            className="rounded-full border px-3 py-1 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead>
            <tr className="text-left text-sm text-gray-700">
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Area</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Driver</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link className="text-blue-600 hover:underline" href={`/admin/orders/${o.id}`}>
                    {o.code}
                  </Link>
                </td>
                <td className="px-3 py-2">{o.customerName ?? "—"}</td>
                <td className="px-3 py-2">{o.customerPhone ?? "—"}</td>
                <td className="px-3 py-2">{[o.suburb, o.city].filter(Boolean).join(", ")}</td>
                <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                <td className="px-3 py-2">
                  {o.delivery?.driver?.name ?? "—"}
                  {o.delivery?.status && (
                    <span className="ml-2 rounded-full border px-2 py-0.5 text-[11px] text-gray-600">
                      {o.delivery.status.replaceAll("_", " ")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">R {Math.round(((o.price ?? 0) + (o.deliveryCents ?? 0)) / 100)}</td>
                <td className="px-3 py-2 text-sm text-gray-600">
                  {o.createdAt ? new Date((o.createdAt as unknown as string)).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-sm text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
