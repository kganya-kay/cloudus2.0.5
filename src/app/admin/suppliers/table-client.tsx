// src/app/admin/suppliers/table-client.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function TableClient() {
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = api.supplier.list.useQuery({
    q: q.trim() || undefined,
    onlyActive: onlyActive || undefined,
    page,
    pageSize,
  });

  const utils = api.useUtils();
  const toggle = api.supplier.toggleActive.useMutation({
    onSuccess: async () => {
      await utils.supplier.list.invalidate();
    },
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;

  type SupplierRow = NonNullable<typeof data>["items"][number];
  const rows: SupplierRow[] = data?.items ?? [];
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
            placeholder="Search name, phone, city, suburb, email"
            className="flex-1 rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => {
                setOnlyActive(e.target.checked);
                setPage(1);
              }}
            />
            Only active
          </label>
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
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Area</th>
              <th className="px-3 py-2">Price/kg</th>
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link className="text-blue-600 hover:underline" href={`/admin/suppliers/${s.id}`}>
                    {s.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{s.phone}</td>
                <td className="px-3 py-2">{[s.suburb, s.city].filter(Boolean).join(", ")}</td>
                <td className="px-3 py-2">{s.pricePerKg != null ? `R ${Math.round(s.pricePerKg / 100)}` : "—"}</td>
                <td className="px-3 py-2">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={s.isActive}
                      onChange={(e) => toggle.mutate({ id: s.id, isActive: e.target.checked })}
                    />
                    <span className="text-sm text-gray-600">{s.isActive ? "Active" : "Inactive"}</span>
                  </label>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                  No suppliers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

