// src/app/caretakers/apply/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { UploadButton } from "~/utils/uploadthing";

export default function CaretakerApplyPage() {
  const apply = api.careers.submitApplication.useMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!name || !email) return;
    apply.mutate({ type: "CARETAKER", name, email, phone: phone || undefined, resumeUrl: resumeUrl || undefined, answers: { notes }, source: "caretakers-apply" });
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <nav className="mb-3 text-sm"><Link href="/" className="text-blue-700 hover:underline">← Home</Link></nav>
      <h1 className="mb-2 text-2xl font-bold">Caretaker Application</h1>
      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-gray-600">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Resume (optional)</label>
            <div className="mt-1">
              <UploadButton endpoint="resumeUploader" onClientUploadComplete={(res) => {
                const url = Array.isArray(res) && res[0]?.url ? String(res[0].url) : undefined;
                if (url) setResumeUrl(url);
              }} onUploadError={(e: Error) => alert(e.message)} />
              {resumeUrl && <p className="mt-1 truncate text-xs text-gray-600">{resumeUrl}</p>}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={submit} disabled={apply.isPending || !name || !email} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {apply.isPending ? "Submitting…" : "Submit"}
          </button>
        </div>
        {apply.isSuccess && <p className="mt-2 text-sm text-green-700">Thanks! We will be in touch soon.</p>}
      </div>
    </main>
  );
}
