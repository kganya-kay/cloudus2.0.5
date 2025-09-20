// src/app/admin/orders/[id]/page.tsx
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./view-client";

export default async function OrderPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Client id={idNum} />
    </main>
  );
}

// (optional) if you add metadata, keep params as strings too:
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  return { title: `Order ${params.id} – Admin` };
}
