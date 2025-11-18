import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { SupplierDashboardClient } from "./dashboard-client";
import { AssistantOverlay } from "~/app/_components/AssistantOverlay";
import { isSuperAdminEmail } from "~/server/auth/super-admin";

export default async function SupplierDashboardPage(props: {
  searchParams: Promise<{ supplierId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?next=/suppliers/dashboard");
  }

  const role = session.user.role;
  const email = session.user.email ?? null;
  const isSuperAdmin = isSuperAdminEmail(email);
  const canImpersonate = role === Role.ADMIN || role === Role.CARETAKER;

  if (
    role !== Role.SUPPLIER &&
    !canImpersonate &&
    !isSuperAdmin
  ) {
    redirect("/");
  }

  let supplierId = searchParams?.supplierId ?? null;

  let profile = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      supplierId: true,
      supplier: { select: { name: true } },
    },
  });

  if (!supplierId) {
    supplierId = profile?.supplierId ?? null;
  }

  if (!supplierId && isSuperAdmin) {
    supplierId = await linkSuperAdminSupplierProfile({
      userId: session.user.id,
      name: session.user.name ?? null,
      email,
    });
    profile = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        supplierId: true,
        supplier: { select: { name: true } },
      },
    });
  }

  if (!supplierId && role === Role.SUPPLIER) {
    redirect("/suppliers/apply?toast=link_supplier");
  }

  return (
    <>
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <SupplierDashboardClient
          initialSupplierId={supplierId}
          initialSupplierName={profile?.supplier?.name ?? null}
          viewerRole={role}
        />
      </main>
      <AssistantOverlay />
    </>
  );
}

async function linkSuperAdminSupplierProfile({
  userId,
  name,
  email,
}: {
  userId: string;
  name: string | null;
  email: string | null;
}) {
  let existing: { id: string } | null = null;
  if (email) {
    existing = await db.supplier.findFirst({
      where: { email },
      select: { id: true },
    });
  }

  const supplier =
    existing ??
    (await db.supplier.create({
      data: {
        name: name ?? email ?? "Supplier tester",
        phone: email ?? "0000000000",
        email: email ?? undefined,
        suburb: "Auto",
        city: "Auto",
        notes: "Auto-linked for super admin testing",
        isActive: true,
      },
      select: { id: true },
    }));

  await db.user.update({
    where: { id: userId },
    data: { supplierId: supplier.id },
  });

  return supplier.id;
}
