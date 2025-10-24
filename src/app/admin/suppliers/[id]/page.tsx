// src/app/admin/suppliers/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./view-client";

export default async function SupplierPage({
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
  if (!id) redirect("/admin/suppliers");

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/admin" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Back to Admin</Link>
        <Link href="/admin/suppliers" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Suppliers</Link>
      </div>
      <Client id={id} />
    </main>
  );
}
