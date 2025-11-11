// src/app/admin/suppliers/[id]/view-client.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  const update = api.supplier.update.useMutation({
    onSuccess: async () => {
      await utils.supplier.getById.invalidate({ id });
      await utils.supplier.list.invalidate();
    },
  });


  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [priceRands, setPriceRands] = useState("");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);

  useMemo(() => {
    if (!data) return;
    setName(data.name ?? "");
    setPhone(data.phone ?? "");
    setEmail(data.email ?? "");
    setSuburb(data.suburb ?? "");
    setCity(data.city ?? "");
    setPriceRands(data.pricePerKg != null ? String(Math.round(data.pricePerKg / 100)) : "");
    setRating(data.rating != null ? String(data.rating) : "");
    setNotes(data.notes ?? "");
    setIsActive(Boolean(data.isActive));
  }, [data]);
  if (isLoading || !data) return <p className="text-sm text-gray-500">Loading…</p>;
  const s = data;
  return (
    <div className="rounded-xl border bg-white p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const pricePerKgCents = priceRands ? Math.round((Number(priceRands) || 0) * 100) : null;
          const ratingNum = rating ? Number(rating) : null;
          update.mutate({
            id,
            name,
            phone,
            email: email || null,
            suburb: suburb || null,
            city: city || null,
            pricePerKgCents,
            rating: ratingNum,
            notes: notes || null,
            isActive,
          });
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Supplier</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span>{isActive ? "Active" : "Inactive"}</span>
            </label>
            <button
              type="button"
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

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-gray-600">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Suburb</label>
            <input value={suburb} onChange={(e) => setSuburb(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Price per Kg (Rands)</label>
            <input value={priceRands} onChange={(e) => setPriceRands(e.target.value)} type="number" min="0" step="0.01" className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Rating (0-5)</label>
            <input value={rating} onChange={(e) => setRating(e.target.value)} type="number" min="0" max="5" step="0.1" className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-4 py-2 text-sm" />
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button type="submit" disabled={update.isPending} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {update.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

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

