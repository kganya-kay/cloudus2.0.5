// src/app/admin/orders/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./view-client";

export default async function OrderPage({
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
  if (!Number.isFinite(idNum)) redirect("/admin");

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/admin" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Back to Admin</Link>
        <Link href="/admin/orders" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Orders</Link>
      </div>
      <Client id={idNum} />
    </main>
  );
}


