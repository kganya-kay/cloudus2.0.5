// src/app/profile/[email]/page.tsx
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import ProfileEditor from "../_components/ProfileEditor";

export const dynamic = "force-dynamic";

export default async function ProfilePage(props: any) {
  const { email } = await props.params;
  const session = await auth();

  const sessionEmail = session?.user?.email ?? null;
  if (!sessionEmail) {
    redirect("/?toast=login_required");
  }

  const requested = decodeURIComponent(email as string);
  if (requested.toLowerCase() !== sessionEmail.toLowerCase()) {
    redirect("/?toast=login_required");
  }

  const user = (await db.user.findUnique({
    where: { email: sessionEmail },
    include: { supplier: true, driver: true, addresses: { include: { address: true } } },
  } as any)) as any;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Your Profile</h1>
      <div className="rounded-xl border bg-white p-4">
        <div className="space-y-1 text-sm">
          <p><span className="text-gray-600">Name:</span> {user?.name ?? "-"}</p>
          <p><span className="text-gray-600">Email:</span> {sessionEmail}</p>
          <p><span className="text-gray-600">Role:</span> {user?.role ?? "-"}</p>
          <p><span className="text-gray-600">Supplier:</span> {user?.supplier?.name ?? "-"}</p>
          <p><span className="text-gray-600">Driver:</span> {user?.driver?.name ?? "-"}</p>
        </div>
        {user?.addresses && user.addresses.length > 0 && (
          <div className="mt-4">
            <h2 className="mb-2 text-sm font-semibold">Addresses</h2>
            <ul className="list-inside list-disc text-sm text-gray-700">
              {user.addresses.map((ua: any) => (
                <li key={ua.id}>{[ua.address?.line1, ua.address?.suburb, ua.address?.city].filter(Boolean).join(", ")}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6">
        <ProfileEditor
          initialName={user?.name}
          initialImage={user?.image}
          initialAddress={{
            line1: user?.addresses?.[0]?.address?.line1,
            suburb: user?.addresses?.[0]?.address?.suburb,
            city: user?.addresses?.[0]?.address?.city,
          }}
        />
      </div>
    </main>
  );
}
