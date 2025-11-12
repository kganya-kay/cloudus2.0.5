// src/app/admin/applications/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./table-client";

export default async function ApplicationsPage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Admin</Link>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        </div>
      </div>
      <Client />
    </main>
  );
}

