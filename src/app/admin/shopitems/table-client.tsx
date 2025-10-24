// src/app/admin/shopitems/table-client.tsx
"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function Client() {
  const { data, isLoading } = api.shopItem.getAll.useQuery();
  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;

  type Row = NonNullable<typeof data>[number];
  const rows: Row[] = data ?? [];

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full divide-y">
        <thead>
          <tr className="text-left text-sm text-gray-700">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Price</th>
            <th className="px-3 py-2">Supplier</th>
            <th className="px-3 py-2">Orders</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">
                <Link className="text-blue-600 hover:underline" href={`/admin/shopitems/${r.id}`}>
                  {r.name}
                </Link>
              </td>
              <td className="px-3 py-2">{r.type}</td>
              <td className="px-3 py-2">R {Math.round(r.price / 100)}</td>
              <td className="px-3 py-2">{(r as unknown as { supplier?: { name?: string } }).supplier?.name ?? "—"}</td>
              <td className="px-3 py-2">{(r as unknown as { ordersCount?: number }).ordersCount ?? "—"}</td>
              <td className="px-3 py-2 text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                No shop items found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
