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
      <div className="space-y-6">
        <header className="os-card p-5">
          <h1 className="os-title">Studio</h1>
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
