// src/app/admin/applications/table-client.tsx
"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function Client() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = api.careers.listApplications.useQuery({ q: q || undefined, status: (status || undefined) as any, page: 1, pageSize: 50 });
  const setStatusMut = api.careers.setApplicationStatus.useMutation();
  const utils = api.useUtils();

  const rows: any[] = data?.items ?? [];
  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-gray-600">Search</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 w-64 rounded-full border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-48 rounded-full border px-3 py-2 text-sm">
            <option value="">All</option>
            {(["RECEIVED","IN_REVIEW","INTERVIEW","OFFER","HIRED","REJECTED","WITHDRAWN"] as const).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead>
              <tr className="text-left text-sm text-gray-700">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 text-xs text-gray-500">{new Date(r.createdAt as unknown as string).toLocaleString()}</td>
                  <td className="px-3 py-2 text-sm">{r.name}</td>
                  <td className="px-3 py-2 text-sm">{r.email}</td>
                  <td className="px-3 py-2 text-sm">{r.phone ?? "—"}</td>
                  <td className="px-3 py-2 text-sm">{r.job?.title ?? r.job?.slug}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className="rounded-full border px-2 py-0.5 text-xs">{r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {(["IN_REVIEW","INTERVIEW","OFFER","HIRED","REJECTED"] as const).map((s) => (
                        <button key={s} className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50" onClick={async () => {
                          await setStatusMut.mutateAsync({ id: r.id, status: s as any });
                          await utils.careers.listApplications.invalidate();
                        }}>{s}</button>
                      ))}
                      {r.resumeUrl ? (
                        <a href={r.resumeUrl} target="_blank" rel="noreferrer" className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50">Resume</a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
