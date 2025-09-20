// src/app/admin/orders/[id]/page.tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "~/server/auth";
import Client from "./view-client";

export default async function OrderPage({
  params,
}: {
  params:  { id: number };
}) {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) redirect("/admin");

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Client id={params.id} />
    </main>
  );
}


