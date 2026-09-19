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
          <p className="os-kicker">Creator hub</p>
          <h1 className="os-title mt-2">Your work, in one place</h1>
          <p className="os-muted mt-2">Publish updates, manage tasks, and keep the feed moving.</p>
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
