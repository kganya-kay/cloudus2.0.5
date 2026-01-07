// src/app/admin/projects/table-client.tsx
"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

function formatRands(cents?: number | null) {
  const r = Math.round((cents ?? 0) / 100);
  return `R ${r}`;
}

export default function TableClient() {
  const { data, isLoading } = api.project.getAll.useQuery();
  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  type Row = NonNullable<typeof data>[number];
  const rows: Row[] = data ?? [];

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full divide-y">
        <thead>
          <tr className="text-left text-sm text-gray-700">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Price</th>
            <th className="px-3 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">
                <Link className="text-blue-600 hover:underline" href={`/admin/projects/${r.id}`}>
                  {r.name}
                </Link>
              </td>
              <td className="px-3 py-2">{r.type}</td>
              <td className="px-3 py-2">{r.status ?? ""}</td>
              <td className="px-3 py-2">{formatRands(r.price)}</td>
              <td className="px-3 py-2 text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                No projects found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
