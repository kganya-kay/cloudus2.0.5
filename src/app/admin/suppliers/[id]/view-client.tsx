// src/app/admin/suppliers/[id]/view-client.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function Client({ id }: { id: string }) {
  const router = useRouter();
  const utils = api.useUtils();
  const { data, isLoading } = api.supplier.getById.useQuery({ id });
  const del = api.supplier.delete.useMutation({
    onSuccess: async () => {
      await utils.supplier.list.invalidate();
      router.push("/admin/suppliers");
    },
  });

  if (isLoading || !data) return <p className="text-sm text-gray-500">Loading…</p>;

  const s = data;
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{s.name}</h1>
          <p className="text-sm text-gray-500">{[s.suburb, s.city].filter(Boolean).join(", ") || "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.isActive ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
            {s.isActive ? "Active" : "Inactive"}
          </span>
          <button
            onClick={() => {
              if (del.isPending) return;
              const ok = confirm("Delete this supplier? This cannot be undone.");
              if (!ok) return;
              del.mutate({ id });
            }}
            disabled={del.isPending}
            className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {del.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
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

      <section className="mt-4 rounded-lg border p-3">
        <h2 className="mb-2 text-sm font-semibold">Shop Items Supplied</h2>
        {s.shopItems && s.shopItems.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y">
              <thead>
                <tr className="text-left text-sm text-gray-700">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {s.shopItems.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {it.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.image} alt="" className="h-8 w-8 rounded object-cover ring-1 ring-gray-200" />
                        ) : null}
                        <span className="text-sm text-gray-800">{it.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{it.type}</td>
                    <td className="px-3 py-2 text-sm">R {Math.round((it.price ?? 0) / 100)}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">{new Date(it.createdAt as unknown as string).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex gap-2">
                        <Link href={`/shop/item/${it.id}`} className="rounded-full border px-3 py-1 hover:bg-gray-50">View</Link>
                        <Link href={`/admin/shopitems`} className="rounded-full border px-3 py-1 hover:bg-gray-50">Manage</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No shop items found for this supplier.</p>
        )}
      </section>
    </div>
  );
}
