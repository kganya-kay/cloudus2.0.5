// src/app/admin/shopitems/create/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./client";

export default async function CreateShopItemPage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Back to Admin</Link>
        <Link href="/admin/shopitems" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Shop Items</Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Shop Item</h1>
      </div>
      <Client />
    </main>
  );
}

