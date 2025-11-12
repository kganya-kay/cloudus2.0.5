// src/app/apply/page.tsx
"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

const TYPES = ["SUPPLIER", "DRIVER", "CARETAKER", "ADMIN", "CUSTOMER", "APPLICANT"] as const;
type ApplyType = typeof TYPES[number];

export default function UnifiedApplyPage() {
  const [type, setType] = useState<ApplyType>("APPLICANT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const apply = api.careers.apply.useMutation();

  const submit = () => {
    if (!name || !email) return;
    const answers: Record<string, unknown> = { notes };
    apply.mutate({ type, name, email, phone: phone || undefined, resumeUrl: resumeUrl || undefined, answers, source: "unified-apply" });
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Apply / Onboard</h1>
      <p className="mb-4 text-sm text-gray-600">Choose your path and submit your details. We will reach out.</p>
      <div className="rounded-lg border bg-white p-4">
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-gray-600">I am a</label>
            <select value={type} onChange={(e) => setType(e.target.value as ApplyType)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm">
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
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
            <label className="text-xs text-gray-600">Resume URL (optional)</label>
            <input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={submit} disabled={apply.isPending || !name || !email} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {apply.isPending ? "Submitting…" : "Submit"}
          </button>
        </div>
        {apply.isSuccess && (
          <p className="mt-2 text-sm text-green-700">Thanks! Your application has been received.</p>
        )}
      </div>
    </main>
  );
}

