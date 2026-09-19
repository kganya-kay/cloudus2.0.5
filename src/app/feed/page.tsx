import Link from "next/link";
import { HydrateClient, api } from "~/trpc/server";
import { FeedClient } from "./feed-client";
import { Avatar, Button, Card, PageHeader } from "~/components/os/primitives";

export default async function FeedPage() {
  const [featuredCreators, announcements] = await Promise.all([
    api.creator.featured().catch(() => []),
    api.platform.announcements({ limit: 3 }).catch(() => []),
  ]);

  return (
    <HydrateClient>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Community"
          title="Feed"
          description="Shipped work, drops, and collabs. Publish from the creator hub."
          actions={
            <>
              <Button href="/creators/dashboard">Publish</Button>
              <Button href="/community" variant="secondary">Creators</Button>
            </>
          }
        />

        {announcements.length > 0 ? (
          <Card>
            <p className="os-kicker">Studio updates</p>
            <div className="mt-3 space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id}>
                  <p className="font-medium">{announcement.title}</p>
                  <p className="os-muted">{announcement.body}</p>
                  {announcement.link ? (
                    <Link href={announcement.link} className="text-sm font-semibold text-os-accent">
                      Details
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {featuredCreators.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {featuredCreators.slice(0, 6).map((creator) => (
              <Card key={creator.id} className="flex items-center gap-3">
                <Avatar src={creator.avatarUrl ?? creator.user?.image} name={creator.displayName} />
                <div>
                  <p className="font-medium">{creator.displayName}</p>
                  <p className="os-muted">@{creator.handle}</p>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        <FeedClient />
      </div>
    </HydrateClient>
  );
}
