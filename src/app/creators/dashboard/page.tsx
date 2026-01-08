import { redirect } from "next/navigation";

import { HydrateClient, api } from "~/trpc/server";
import { auth } from "~/server/auth";
import CreatorDashboardClient from "./creator-dashboard-client";

export default async function CreatorDashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login?callbackUrl=/creators/dashboard");
  }
  const [profile, feedPreview, workSummary] = await Promise.all([
    api.creator.me(),
    api.feed.list({ limit: 4 }),
    api.project.contributorOverview(),
  ]);

  return (
    <HydrateClient>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-0">
        <header className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-blue-600">Creator control room</p>
          <p className="text-sm text-gray-600">
            Build your visual ideas, preview them and have them delivered to you seamlessly.
          </p>
        </header>
        <CreatorDashboardClient
          initialProfile={profile}
          recentFeed={feedPreview.items}
          workSummary={workSummary}
        />
      </div>
    </HydrateClient>
  );
}
