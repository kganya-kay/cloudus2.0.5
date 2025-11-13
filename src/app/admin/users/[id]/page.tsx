// src/app/admin/users/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import ChangePassword from "../_components/ChangePassword";
import UserAdminControls from "../_components/UserAdminControls";

export const dynamic = "force-dynamic";

export default async function AdminUserDetail(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  const role = session.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  const user = await db.user.findUnique({
    where: { id },
    include: {
      supplier: true,
      driver: true,
      sessions: true,
    },
  });

  if (!user) return notFound();

  const orders = await db.order.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Manage User</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Profile</h2>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-600">Name:</span> {user.name ?? "—"}</p>
            <p><span className="text-gray-600">Email:</span> {user.email ?? "—"}</p>
            <p><span className="text-gray-600">Role:</span> {user.role}</p>
            <p><span className="text-gray-600">Supplier:</span> {user.supplier?.name ?? "—"}</p>
            <p><span className="text-gray-600">Driver:</span> {user.driver?.name ?? "—"}</p>
          </div>
          <div className="mt-4">
            <ChangePassword userId={user.id} />
          </div>
        </section>

        <UserAdminControls
          user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
          isSelf={session.user.id === user.id}
        />

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Active Sessions</h2>
          <div className="divide-y text-sm">
            {user.sessions.length === 0 && <p className="text-gray-600">No active sessions.</p>}
            {user.sessions.map((s) => (
              <div key={s.id} className="py-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{s.sessionToken.slice(0, 12)}…</span>
                  <span className="text-gray-500">exp {new Date(s.expires).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4 md:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Recent Orders</h2>
          <div className="overflow-hidden rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-3 py-2 text-sm">{o.code}</td>
                    <td className="px-3 py-2 text-sm">{o.name}</td>
                    <td className="px-3 py-2 text-sm">{(o.price / 100).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm">{o.status}</td>
                    <td className="px-3 py-2 text-sm">{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-600">
                      No recent orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
