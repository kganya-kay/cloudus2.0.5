import { redirect } from "next/navigation";

import { Role } from "@prisma/client";
import { HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import { AuditLogClient } from "./AuditLogClient";

export default async function AdminAuditPage() {
  const session = await auth();
  const allowedRoles: Role[] = [Role.ADMIN, Role.CARETAKER];
  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    redirect("/admin");
  }

  return (
    <HydrateClient>
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <header className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300">
            Control room
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Audit viewer</h1>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Review every order action, payment update, and supplier/caretaker change for compliance.
          </p>
        </header>
        <AuditLogClient />
      </div>
    </HydrateClient>
  );
}
