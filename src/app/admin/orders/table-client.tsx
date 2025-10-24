// src/app/admin/orders/table-client.tsx
"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { StatusBadge } from "../_components/StatusBadge";

export default function TableClient() {
  const { data, isLoading } = api.order.listToday.useQuery();

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;

  const rows = data ? (Object.values(data as Record<string, any[]>).flat() as any[]) : [];

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full divide-y">
        <thead>
          <tr className="text-left text-sm text-gray-700">
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Area</th>
            <th className="px-3 py-2">Status</th>
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
              <td className="px-3 py-2">R {Math.round(((o.price ?? 0) + (o.deliveryCents ?? 0)) / 100)}</td>
              <td className="px-3 py-2 text-sm text-gray-600">
                {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                No orders for today.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

