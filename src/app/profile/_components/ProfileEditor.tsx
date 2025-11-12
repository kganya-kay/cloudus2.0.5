// src/app/profile/_components/ProfileEditor.tsx
"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "~/app/api/uploadthing/core";

export default function ProfileEditor({
  initialName,
  initialImage,
  initialAddress,
}: {
  initialName: string | null | undefined;
  initialImage: string | null | undefined;
  initialAddress?: { line1?: string; suburb?: string; city?: string } | null;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [image, setImage] = useState(initialImage ?? "");
  const [line1, setLine1] = useState(initialAddress?.line1 ?? "");
  const [suburb, setSuburb] = useState(initialAddress?.suburb ?? "");
  const [city, setCity] = useState(initialAddress?.city ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSave = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/profile/self", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, image: image || undefined, address: { line1, suburb, city } }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error ?? "Failed to update profile");
      } else {
        setMsg("Profile updated");
        // Simple reload to show freshest server data
        setTimeout(() => window.location.reload(), 600);
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Edit Profile</h2>

      <div className="mb-4 flex items-center gap-3">
        {/* Avatar preview */}
        <img
          src={image || "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV"}
          alt="Avatar"
          className="h-14 w-14 rounded-full object-cover ring-1 ring-gray-200"
        />
        <UploadButton<OurFileRouter, "imageUploader">
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            const url = res?.[0]?.url;
            if (url) setImage(url);
          }}
          onUploadError={(e: Error) => {
            setErr(e.message || "Upload failed");
          }}
        />
      </div>

      <div className="grid gap-3">
        <div>
          <label className="text-xs text-gray-600">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="text-xs text-gray-600">Address line 1</label>
            <input value={line1} onChange={(e) => setLine1(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Suburb</label>
            <input value={suburb} onChange={(e) => setSuburb(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <div className="flex gap-2">
          <button onClick={onSave} disabled={busy} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
