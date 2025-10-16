// src/app/admin/orders/[id]/page.tsx
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./view-client";

export default async function OrderPage({ params }: any) {
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
      <Client id={idNum} />
    </main>
  );
}


