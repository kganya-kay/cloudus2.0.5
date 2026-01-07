// src/app/admin/projects/[id]/client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

const parseLinks = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

export default function Client({ id }: { id: number }) {
  const router = useRouter();
  const utils = api.useUtils();
  const { data: project, isLoading } = api.project.select.useQuery({ id });

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [priceRands, setPriceRands] = useState("");
  const [link, setLink] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [image, setImage] = useState("");
  const [linksText, setLinksText] = useState("");
  const [status, setStatus] = useState("");
  const [openSource, setOpenSource] = useState(false);
  const [completed, setCompleted] = useState(false);

  useMemo(() => {
    if (!project) return;
    setName(project.name ?? "");
    setType(project.type ?? "");
    setDescription(project.description ?? "");
    setPriceRands(String(Math.round((project.price ?? 0) / 100)));
    setLink(project.link ?? "");
    setContactNumber(String(project.contactNumber ?? 0));
    setImage(project.image ?? "");
    setLinksText(Array.isArray(project.links) ? project.links.join("\n") : "");
    setStatus(project.status ?? "");
    setOpenSource(Boolean(project.openSource));
    setCompleted(Boolean(project.completed));
  }, [project]);

  const update = api.project.update.useMutation({
    onSuccess: async () => {
      await utils.project.getAll.invalidate();
      await utils.project.select.invalidate({ id });
      router.push("/admin/projects");
    },
  });

  const del = api.project.delete.useMutation({
    onSuccess: async () => {
      await utils.project.getAll.invalidate();
      router.push("/admin/projects");
    },
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!project) return <p className="text-sm text-gray-500">Project not found.</p>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const priceCents = Math.max(0, Math.round((Number(priceRands) || 0) * 100));
        const contact = Number(contactNumber) || 0;
        const links = parseLinks(linksText);
        update.mutate({
          id,
          data: {
            name,
            type,
            description,
            price: priceCents,
            link,
            contactNumber: contact,
            image: image || undefined,
            links: links.length > 0 ? links : [],
            status,
            openSource,
            completed,
          },
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
          <label className="text-xs text-gray-600">Status</label>
          <input value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={openSource} onChange={(e) => setOpenSource(e.target.checked)} />
            Open source
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} />
            Completed
          </label>
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

      <div className="mt-4 flex justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            if (del.isPending) return;
            const ok = confirm("Delete this project? This cannot be undone.");
            if (!ok) return;
            del.mutate({ id });
          }}
          disabled={del.isPending}
          className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {del.isPending ? "Deleting..." : "Delete"}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => router.push("/admin/projects")} className="rounded-full border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={update.isPending} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {update.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

