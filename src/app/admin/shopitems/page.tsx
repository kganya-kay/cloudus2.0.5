// src/app/admin/shopitems/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./table-client";

export default async function AdminShopItemsPage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Back to Admin</Link>
        <h1 className="text-2xl font-bold text-gray-900">Shop Items</h1>
        <div className="ml-auto">
          <Link href="/admin/shopitems/create" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">New Item</Link>
        </div>
      </div>
      <Client />
    </main>
  );
}

