// src/app/admin/page.tsx
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "~/server/auth";
import Link from "next/link";
import AdminBoard from "./_components/AdminBoard";
import AdminSummary from "./_components/AdminSummary";
import AdminManualOrder from "./_components/AdminManualOrder";


export default async function AdminHome() {
const session = await auth();
const role = session?.user.role;
if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
redirect("/");
}
  return (
    <main className="mx-auto max-w-7xl p-6">
      {/* Quick links */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Link href="/admin/suppliers" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50">Suppliers</Link>
        <Link href="/admin/drivers" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50">Drivers</Link>
        <Link href="/admin/orders" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50">Orders</Link>
        <Link href="/admin/shopitems" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50">Shop Items</Link>
        <Link href="/admin/reports" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50">Reports</Link>
        <Link href="/admin/applications" className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50">Applications</Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
      </div>
      <AdminSummary />
      <AdminManualOrder />
      <AdminBoard />
    </main>
  );
}
