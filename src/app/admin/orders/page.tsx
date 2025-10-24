// src/app/admin/orders/page.tsx
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import TableClient from "./table-client";

export default async function OrdersPage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Orders</h1>
      <TableClient />
    </main>
  );
}

