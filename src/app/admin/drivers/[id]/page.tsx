// src/app/admin/drivers/[id]/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import type { DriverProfile } from "~/types/driver";
import Client from "./view-client";

export default async function DriverPage({
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
  if (!id) redirect("/admin/drivers");

  const driverRecord = await db.driver.findUnique({ where: { id } });
  const driver = driverRecord as DriverProfile | null;

  if (!driver) {
    redirect("/admin/drivers");
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-3 flex items-center gap-3">
        <Link href="/admin" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Admin</Link>
        <Link href="/admin/drivers" className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50">← Drivers</Link>
      </div>
      <Client id={id} initialDriver={driver} />
    </main>
  );
}
