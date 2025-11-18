import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { DashboardClient } from "./dashboard-client";
import { AssistantOverlay } from "~/app/_components/AssistantOverlay";
import { isSuperAdminEmail } from "~/server/auth/super-admin";

export default async function DriverDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?next=/drivers/dashboard");
  }
  const email = session.user.email ?? null;
  const isSuperAdmin = isSuperAdminEmail(email);
  if (session.user.role !== "DRIVER" && !isSuperAdmin) {
    redirect("/");
  }

  let profile = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      driverId: true,
      driver: { select: { name: true } },
    },
  });

  if (!profile?.driverId) {
    if (!isSuperAdmin) {
      redirect("/drivers/apply?toast=link_driver");
    }
    await linkSuperAdminDriverProfile({
      userId: session.user.id,
      name: session.user.name ?? null,
      email,
    });
    profile = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        driverId: true,
        driver: { select: { name: true } },
      },
    });
  }

  const initialName =
    profile?.driver?.name ?? session.user.name ?? session.user.email ?? undefined;

  return (
    <>
      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-600">Driver portal</p>
            <h1 className="text-3xl font-bold text-gray-900">Deliveries & payouts</h1>
            <p className="text-sm text-gray-600">
              Track your current orders, see payout progress, and share your location with the ops team.
            </p>
          </div>
          <Link
            href={
              session.user.email
                ? `/profile/${encodeURIComponent(session.user.email)}`
                : "/profile"
            }
            className="inline-flex items-center justify-center rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Update profile
          </Link>
        </div>

        <DashboardClient initialName={initialName} />
      </main>
      <AssistantOverlay />
    </>
  );
}

async function linkSuperAdminDriverProfile({
  userId,
  name,
  email,
}: {
  userId: string;
  name: string | null;
  email: string | null;
}) {
  const existingDriver =
    email &&
    (await db.driver.findFirst({
      where: { email },
      select: { id: true },
    }));

  const driver =
    existingDriver ??
    (await db.driver.create({
      data: {
        name: name ?? email ?? "Driver tester",
        phone: email ?? "0000000000",
        email: email ?? undefined,
        notes: "Auto-linked for super admin testing",
        isActive: true,
      },
      select: { id: true },
    }));

  const driverId = typeof driver === "string" ? driver : driver.id;
  await db.user.update({
    where: { id: userId },
    data: { driverId },
  });
}
