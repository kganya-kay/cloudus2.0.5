// src/app/admin/suppliers/[id]/view-client.tsx
"use client";

import { api } from "~/trpc/react";

export default function Client({ id }: { id: string }) {
  const { data, isLoading } = api.supplier.getById.useQuery({ id });

  if (isLoading || !data) return <p className="text-sm text-gray-500">Loading…</p>;

  const s = data;
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{s.name}</h1>
          <p className="text-sm text-gray-500">{[s.suburb, s.city].filter(Boolean).join(", ") || "—"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
          {s.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border p-3">
          <h2 className="mb-2 text-sm font-semibold">Contact</h2>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>Phone: {s.phone}</li>
            <li>Email: {s.email ?? "—"}</li>
          </ul>
        </section>

        <section className="rounded-lg border p-3">
          <h2 className="mb-2 text-sm font-semibold">Details</h2>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>Price/kg: {s.pricePerKg != null ? `R ${Math.round(s.pricePerKg / 100)}` : "—"}</li>
            <li>Rating: {s.rating != null ? s.rating.toFixed(1) : "—"}</li>
            <li>Created: {new Date(s.createdAt as unknown as string).toLocaleString()}</li>
          </ul>
        </section>
      </div>

      {s.notes && (
        <section className="mt-4 rounded-lg border p-3">
          <h2 className="mb-2 text-sm font-semibold">Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{s.notes}</p>
        </section>
      )}
    </div>
  );
}

