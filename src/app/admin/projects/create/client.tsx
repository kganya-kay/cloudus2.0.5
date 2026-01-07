// src/app/admin/projects/create/client.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

const parseLinks = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export default function Client() {
  const router = useRouter();
  const utils = api.useUtils();

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [priceRands, setPriceRands] = useState("");
  const [link, setLink] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [image, setImage] = useState("");
  const [linksText, setLinksText] = useState("");

  const create = api.project.create.useMutation({
    onSuccess: async () => {
      await utils.project.getAll.invalidate();
      router.push("/admin/projects");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const priceCents = Math.max(0, Math.round((Number(priceRands) || 0) * 100));
        const contact = Number(contactNumber) || 0;
        const links = parseLinks(linksText);
        create.mutate({
          name,
          type,
          description,
          price: priceCents,
          link,
          contactNumber: contact,
          image: image || undefined,
          links: links.length > 0 ? links : undefined,
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
          <label className="text-xs text-gray-600">Type</label>
          <input value={type} onChange={(e) => setType(e.target.value)} required className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Price (Rands)</label>
          <input value={priceRands} onChange={(e) => setPriceRands(e.target.value)} type="number" min="0" step="0.01" className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Contact Number</label>
          <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} type="tel" className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">External Link</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">Image URL</label>
          <input value={image} onChange={(e) => setImage(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-4 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">Gallery links (one per line or comma separated)</label>
          <textarea value={linksText} onChange={(e) => setLinksText(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-4 py-2 text-sm" />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/admin/projects")} className="rounded-full border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={create.isPending} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {create.isPending ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}

