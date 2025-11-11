// src/app/admin/suppliers/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import TableClient from "./table-client";

export default async function SuppliersPage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Back to Admin</Link>
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <div className="ml-auto">
          <Link href="/admin/suppliers/create" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">New Supplier</Link>
        </div>
      </div>
      <TableClient />
    </main>
  );
}
