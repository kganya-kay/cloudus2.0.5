// src/app/admin/suppliers/[id]/page.tsx
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
      <Client id={id} />
    </main>
  );
}

