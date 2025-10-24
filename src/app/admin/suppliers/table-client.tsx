// src/app/admin/suppliers/table-client.tsx
"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function TableClient() {
  const { data, isLoading } = api.supplier.list.useQuery({});
  const utils = api.useUtils();
  const toggle = api.supplier.toggleActive.useMutation({
    onSuccess: async () => {
      await utils.supplier.list.invalidate();
    },
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full divide-y">
        <thead>
          <tr className="text-left text-sm text-gray-700">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Area</th>
            <th className="px-3 py-2">Price/kg</th>
            <th className="px-3 py-2">Active</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((s) => (
            <tr key={s.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2">
                <Link className="text-blue-600 hover:underline" href={`/admin/suppliers/${s.id}`}>
                  {s.name}
                </Link>
              </td>
              <td className="px-3 py-2">{s.phone}</td>
              <td className="px-3 py-2">
                {[s.suburb, s.city].filter(Boolean).join(", ")}
              </td>
              <td className="px-3 py-2">
                {s.pricePerKg != null ? `R ${Math.round(s.pricePerKg / 100)}` : "—"}
              </td>
              <td className="px-3 py-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked={s.isActive}
                    onChange={(e) =>
                      toggle.mutate({ id: s.id, isActive: e.target.checked })
                    }
                  />
                  <span className="text-sm text-gray-600">
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
