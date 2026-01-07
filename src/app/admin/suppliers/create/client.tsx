// src/app/admin/suppliers/create/client.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function Client() {
  const router = useRouter();
  const utils = api.useUtils();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [priceRands, setPriceRands] = useState("");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const create = api.supplier.create.useMutation({
    onSuccess: async () => {
      await utils.supplier.invalidate();
      router.push("/admin/suppliers");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const pricePerKgCents = priceRands ? Math.round((Number(priceRands) || 0) * 100) : undefined;
        const ratingNum = rating ? Number(rating) : undefined;
        create.mutate({
          name,
          phone,
          email: email || undefined,
          suburb: suburb || undefined,
          city: city || undefined,
          type: type || undefined,
          description: description || undefined,
          pricePerKgCents,
          rating: ratingNum,
          notes: notes || undefined,
          isActive,
        });
      }}
      className="rounded-xl border bg-white p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
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
          <label className="text-xs text-gray-600">Type</label>
          <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Laundry or Service" className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Price per Kg (Rands)</label>
          <input value={priceRands} onChange={(e) => setPriceRands(e.target.value)} type="number" min="0" step="0.01" className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Rating (0-5)</label>
          <input value={rating} onChange={(e) => setRating(e.target.value)} type="number" min="0" max="5" step="0.1" className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <input id="isActive" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-4 py-2 text-sm" />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/admin/suppliers")} className="rounded-full border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={create.isPending} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {create.isPending ? "Creating…" : "Create Supplier"}
        </button>
      </div>
    </form>
  );
}
