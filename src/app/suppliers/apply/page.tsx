// src/app/suppliers/apply/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function SupplierApplyPage() {
  const apply = api.careers.apply.useMutation();
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!name || !email) return;
    apply.mutate({
      type: "SUPPLIER",
      name,
      email,
      phone: phone || undefined,
      answers: { company, city, suburb, notes },
      source: "suppliers-apply",
    });
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <nav className="mb-3 text-sm"><Link href="/" className="text-blue-700 hover:underline">← Home</Link></nav>
      <h1 className="mb-2 text-2xl font-bold">Supplier Onboarding</h1>
      <p className="mb-4 text-sm text-gray-600">Apply to partner with Cloudus as a supplier.</p>
      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Contact Name</label>
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
          <div>
            <label className="text-xs text-gray-600">City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Suburb</label>
            <input value={suburb} onChange={(e) => setSuburb(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
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
        {apply.isSuccess && (
          <p className="mt-2 text-sm text-green-700">Thanks! We will be in touch soon.</p>
        )}
      </div>
    </main>
  );
}

