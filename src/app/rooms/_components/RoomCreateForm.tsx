"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

type FormState = {
  title: string;
  description: string;
  nightlyRateCents: number;
  monthlyRateCents: number;
  cleaningFeeCents: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string;
  houseRules: string;
  coverImage: string;
  gallery: string;
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

const defaultState: FormState = {
  title: "",
  description: "",
  nightlyRateCents: 0,
  monthlyRateCents: 0,
  cleaningFeeCents: 0,
  currency: "ZAR",
  maxGuests: 1,
  bedrooms: 0,
  beds: 0,
  bathrooms: 1,
  amenities: "",
  houseRules: "",
  coverImage: "",
  gallery: "",
  addressLine1: "",
  addressLine2: "",
  suburb: "",
  city: "",
  province: "",
  postalCode: "",
  country: "ZA",
};

export function RoomCreateForm() {
  const [form, setForm] = useState<FormState>(defaultState);
  const [message, setMessage] = useState<string | null>(null);

  const mutation = api.room.create.useMutation({
    onSuccess: () => {
      setMessage("Listing created and pending approval.");
      setForm(defaultState);
    },
    onError: (err) => setMessage(err.message),
  });

  const handleChange = (
    key: keyof FormState,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    mutation.mutate({
      title: form.title,
      description: form.description,
      nightlyRateCents: form.nightlyRateCents,
      monthlyRateCents: form.monthlyRateCents || undefined,
      cleaningFeeCents: form.cleaningFeeCents,
      currency: form.currency,
      maxGuests: form.maxGuests,
      bedrooms: form.bedrooms,
      beds: form.beds,
      bathrooms: form.bathrooms,
      amenities: form.amenities
        ? form.amenities.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      houseRules: form.houseRules
        ? form.houseRules.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      coverImage: form.coverImage || undefined,
      gallery: form.gallery
        ? form.gallery.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      address: {
        line1: form.addressLine1,
        line2: form.addressLine2 || undefined,
        suburb: form.suburb || undefined,
        city: form.city,
        province: form.province || undefined,
        postalCode: form.postalCode || undefined,
        country: form.country || "ZA",
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-blue-600">Host</p>
        <h2 className="text-2xl font-semibold text-gray-900">Create a room listing</h2>
        <p className="text-sm text-gray-600">
          Add your property details. Images and listing will go into review before guests can book.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Title
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Cover image URL
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.coverImage}
            onChange={(e) => handleChange("coverImage", e.target.value)}
            placeholder="https://..."
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1 text-sm text-gray-700">
          Description
          <textarea
            className="min-h-[100px] rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Nightly rate (cents)
          <input
            type="number"
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.nightlyRateCents}
            onChange={(e) => handleChange("nightlyRateCents", Number(e.target.value))}
            min={0}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Monthly rate (cents)
          <input
            type="number"
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.monthlyRateCents}
            onChange={(e) => handleChange("monthlyRateCents", Number(e.target.value))}
            min={0}
          />
          <span className="text-xs text-gray-500">Shown first if provided</span>
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Cleaning fee (cents)
          <input
            type="number"
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.cleaningFeeCents}
            onChange={(e) => handleChange("cleaningFeeCents", Number(e.target.value))}
            min={0}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Max guests
          <input
            type="number"
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.maxGuests}
            onChange={(e) => handleChange("maxGuests", Number(e.target.value))}
            min={1}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Bedrooms
          <input
            type="number"
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.bedrooms}
            onChange={(e) => handleChange("bedrooms", Number(e.target.value))}
            min={0}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Beds
          <input
            type="number"
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.beds}
            onChange={(e) => handleChange("beds", Number(e.target.value))}
            min={0}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Bathrooms
          <input
            type="number"
            step="0.5"
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.bathrooms}
            onChange={(e) => handleChange("bathrooms", Number(e.target.value))}
            min={0}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Amenities (comma separated)
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.amenities}
            onChange={(e) => handleChange("amenities", e.target.value)}
            placeholder="WiFi, Parking, Aircon"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          House rules (comma separated)
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.houseRules}
            onChange={(e) => handleChange("houseRules", e.target.value)}
            placeholder="No smoking, No parties"
          />
        </label>
        <label className="md:col-span-2 flex flex-col gap-1 text-sm text-gray-700">
          Gallery URLs (comma separated)
          <textarea
            className="min-h-[80px] rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.gallery}
            onChange={(e) => handleChange("gallery", e.target.value)}
            placeholder="https://... , https://..."
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Address line 1
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.addressLine1}
            onChange={(e) => handleChange("addressLine1", e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Address line 2
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.addressLine2}
            onChange={(e) => handleChange("addressLine2", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Suburb
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.suburb}
            onChange={(e) => handleChange("suburb", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          City
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Province / State
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.province}
            onChange={(e) => handleChange("province", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Postal code
          <input
            className="rounded-md border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={form.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-blue-200"
      >
        {mutation.isPending ? "Creating..." : "Create listing"}
      </button>

      {message && <p className="text-sm text-blue-700">{message}</p>}
    </form>
  );
}
