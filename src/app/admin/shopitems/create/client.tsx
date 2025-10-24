// src/app/admin/shopitems/create/client.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadButton } from "~/utils/uploadthing";
import { api, type RouterOutputs } from "~/trpc/react";

function getUploadedUrl(files: unknown): string | undefined {
  if (!Array.isArray(files) || files.length === 0) return undefined;
  const f = files[0] as Record<string, unknown>;
  const pick = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v : undefined);
  return (
    pick(f.url) ??
    pick(f.ufsUrl) ??
    pick((f.serverData as Record<string, unknown> | undefined)?.url) ??
    (pick(f.key) ? `https://utfs.io/f/${String(f.key)}` : undefined)
  );
}

export default function Client() {
  const router = useRouter();
  const utils = api.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [priceRands, setPriceRands] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [links, setLinks] = useState<string[]>([]);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [supplierId, setSupplierId] = useState<string>("");

  const { data: suppliers } = api.supplier.list.useQuery({ q: supplierQuery || undefined, onlyActive: true, page: 1, pageSize: 50 });
  type SupplierRow = NonNullable<typeof suppliers>["items"][number];

  const create = api.shopItem.create.useMutation({
    onSuccess: async () => {
      await utils.shopItem.invalidate();
      router.push("/admin/shopitems");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const priceCents = Math.round((Number(priceRands) || 0) * 100);
        create.mutate({
          name,
          description,
          type,
          priceCents,
          image,
          link,
          api: "",
          links,
          supplierId,
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
          <label className="text-xs text-gray-600">External Link (optional)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} className="mt-1 w-full rounded-full border px-4 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">Supplier</label>
          <div className="mt-1 flex gap-2">
            <input
              placeholder="Search suppliers"
              value={supplierQuery}
              onChange={(e) => setSupplierQuery(e.target.value)}
              className="w-full rounded-full border px-4 py-2 text-sm"
            />
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-56 rounded-full border px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select supplier
              </option>
              {suppliers?.items?.map((s: SupplierRow) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.city ? `• ${s.city}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-4 py-2 text-sm" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium text-gray-700">Cover image</p>
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              const url = getUploadedUrl(res);
              if (url) setImage(url);
            }}
            onUploadError={(error: Error) => alert(`ERROR: ${error.message}`)}
          />
          {image && <img alt="Cover" src={image} className="mt-2 h-24 w-24 rounded object-cover" />}
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-2 text-xs font-medium text-gray-700">Gallery images</p>
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              const url = getUploadedUrl(res);
              if (url) setLinks((g) => [...g, url]);
            }}
            onUploadError={(error: Error) => alert(`ERROR: ${error.message}`)}
          />
          {links.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {links.map((g) => (
                <img key={g} alt="Gallery" src={g} className="h-16 w-16 rounded object-cover" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/admin/shopitems")} className="rounded-full border px-4 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={create.isPending} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {create.isPending ? "Creating…" : "Create Item"}
        </button>
      </div>
    </form>
  );
}
