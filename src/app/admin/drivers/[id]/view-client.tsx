// src/app/admin/drivers/[id]/view-client.tsx
"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";

export default function Client({ id }: { id: string }) {
  const { data, isLoading } = api.driver.getById.useQuery({ id });
  const utils = api.useUtils();
  const update = api.driver.update.useMutation({
    onSuccess: async () => {
      await utils.driver.getById.invalidate({ id });
      await utils.driver.list.invalidate();
    },
  });
  const del = api.driver.delete.useMutation({
    onSuccess: async () => {
      await utils.driver.list.invalidate();
      window.location.href = "/admin/drivers";
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
  const [isActive, setIsActive] = useState<boolean>(true);

  useMemo(() => {
    if (!data) return;
    setName(data.name ?? "");
    setPhone(data.phone ?? "");
    setEmail(data.email ?? "");
    setSuburb(data.suburb ?? "");
    setCity(data.city ?? "");
    setVehicle(data.vehicle ?? "");
    setRating(data.rating != null ? String(data.rating) : "");
    setNotes(data.notes ?? "");
    setIsActive(Boolean(data.isActive));
  }, [data]);

  if (isLoading || !data) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="rounded-xl border bg-white p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const ratingNum = rating ? Number(rating) : null;
          update.mutate({
            id,
            name,
            phone,
            email: email || null,
            suburb: suburb || null,
            city: city || null,
            vehicle: vehicle || null,
            rating: ratingNum,
            notes: notes || null,
            isActive,
          });
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Driver</h1>
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
                const ok = confirm("Delete this driver? This cannot be undone.");
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
            <label className="text-xs text-gray-600">Vehicle</label>
            <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
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
    </div>
  );
}

