// src/app/admin/shopitems/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./client";

export default async function EditShopItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) redirect("/admin/shopitems");

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Back to Admin</Link>
        <Link href="/admin/shopitems" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Shop Items</Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Shop Item</h1>
      </div>
      <Client id={idNum} />
    </main>
  );
}

