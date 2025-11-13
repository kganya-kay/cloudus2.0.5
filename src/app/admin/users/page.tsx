// src/app/admin/users/page.tsx
import Link from "next/link";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import type { User, Supplier, Driver } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-gray-600">You must be an admin or caretaker.</p>
      </main>
    );
  }

  type UserRow = User & {
    supplier: Supplier | null;
    driver: Driver | null;
    _count: { sessions: number; ordersCreated: number };
  };

  const users: UserRow[] = await db.user.findMany({
    orderBy: { email: "asc" },
    include: {
      supplier: true,
      driver: true,
      _count: { select: { sessions: true, ordersCreated: true } },
    },
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Email</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Role</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Sessions</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Orders</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Supplier</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Driver</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm">{u.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{u.email ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{u.role}</td>
                <td className="px-4 py-2 text-sm">{u._count?.sessions ?? 0}</td>
                <td className="px-4 py-2 text-sm">{u._count?.ordersCreated ?? 0}</td>
                <td className="px-4 py-2 text-sm">{u.supplier?.name ?? "—"}</td>
                <td className="px-4 py-2 text-sm">{u.driver?.name ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/users/${u.id}`} className="rounded-full border px-3 py-1 text-xs">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
