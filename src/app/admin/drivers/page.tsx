// src/app/admin/drivers/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import TableClient from "./table-client";

export default async function DriversPage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
        <Link href="/admin/drivers/create" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">New Driver</Link>
      </div>
      <TableClient />
    </main>
  );
}

