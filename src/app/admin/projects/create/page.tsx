// src/app/admin/projects/create/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import Client from "./client";

export default async function AdminProjectCreatePage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/projects" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">Back to Projects</Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Project</h1>
      </div>
      <Client />
    </main>
  );
}
