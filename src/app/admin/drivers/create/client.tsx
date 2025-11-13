// src/app/admin/drivers/create/client.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function Client() {
  const router = useRouter();
  const create = api.driver.create.useMutation({
    onSuccess: () => {
      router.push("/admin/drivers");
    },
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [rating, setRating] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="rounded-xl border bg-white p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const ratingNum = rating ? Number(rating) : undefined;
          create.mutate({
            name,
            phone,
            email: email || undefined,
            suburb: suburb || undefined,
            city: city || undefined,
            vehicle: vehicle || undefined,
            rating: ratingNum,
            notes: notes || undefined,
          });
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-gray-600">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
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
            <label className="text-xs text-gray-600">Vehicle</label>
            <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Rating (0-5)</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="mt-1 w-full rounded-full border px-4 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button type="button" onClick={() => router.push("/admin/drivers")} className="rounded-full border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={create.isPending || !name || !phone} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {create.isPending ? "Creating…" : "Create Driver"}
          </button>
        </div>
      </form>
    </div>
  );
}
