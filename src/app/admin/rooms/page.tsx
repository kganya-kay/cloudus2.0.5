import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { RoomsAdminClient } from "./rooms-client";

export default async function AdminRoomsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/api/auth/signin");
  }

  return (
    <HydrateClient>
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600">Admin</p>
              <h1 className="text-2xl font-bold text-gray-900">Room Listings Review</h1>
              <p className="text-sm text-gray-600">Approve or reject new room listings.</p>
            </div>
            <Link
              href="/rooms"
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              View rooms
            </Link>
          </div>

          <div className="mt-6">
            <RoomsAdminClient />
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
