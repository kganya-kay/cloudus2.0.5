"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonGrid,
} from "~/components/os/primitives";
import { CommunityStoryDrop } from "~/components/social/CommunityStoryDrop";
import { StoryMediaPlayer } from "~/components/social/StoryMediaPlayer";

export default function CommunityPage() {
  const overview = api.workspace.overview.useQuery(undefined, { retry: false });

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Community" description="Loading builders." />
        <SkeletonGrid />
      </div>
    );
  }

  if (overview.error) {
    return <ErrorState onRetry={() => void overview.refetch()} />;
  }

  const data = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Builders"
        title="Community"
        description="Creator profiles, the activity feed, Build Nights, and collaboration requests. Start with two people."
        actions={
          <>
            <Button href="/Blog">Public blogs</Button>
            <Button href="/feed" variant="secondary">
              Open feed
            </Button>
          </>
        }
      />

      <CommunityStoryDrop />

      {data?.blogs.length ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest stories</h2>
            <Link href="/Blog" className="text-sm font-semibold text-os-accent">
              All blogs
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {data.blogs.map((post) => (
              <Card key={post.id} className="space-y-3">
                <p className="os-kicker">@{post.blog.userName}</p>
                <h3 className="font-semibold">{post.title}</h3>
                <p className="os-muted line-clamp-2">{post.excerpt ?? "A Cloudus story."}</p>
                <StoryMediaPlayer
                  imageUrl={post.coverImage}
                  videoUrl={post.videoUrl}
                  audioUrl={post.audioUrl}
                  title={post.title}
                />
                <Button href={`/Blog/${post.blog.userName}/${post.slug}`} size="sm" variant="secondary">
                  Read
                </Button>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <Card>
          <h2 className="text-lg font-semibold">Creators</h2>
          {data?.creators.length ? (
            <ul className="mt-4 space-y-3">
              {data.creators.map((creator) => (
                <li key={creator.id} className="flex items-center gap-3 rounded-2xl bg-os-elevated p-3">
                  <Avatar src={creator.avatarUrl ?? creator.user.image} name={creator.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{creator.displayName}</p>
                    <p className="os-muted truncate">@{creator.handle}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {creator.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill}>{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No creator profiles yet"
              description="Your GitHub-meets-Behance layer starts when the first profile is published."
              action={<Button href="/creators/dashboard" size="sm">Create profile</Button>}
            />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Activity</h2>
            <Link href="/feed" className="text-sm font-semibold text-os-accent">
              Full feed
            </Link>
          </div>
          {data?.feed.length ? (
            <ul className="mt-4 space-y-3">
              {data.feed.map((item) => (
                <li key={item.id} className="rounded-2xl bg-os-elevated p-3">
                  <p className="text-sm font-medium">{item.title ?? item.caption ?? item.type}</p>
                  <p className="os-muted">@{item.creator.handle}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="The room is quiet"
              description="Ship something and post the recap. The product should generate the story."
            />
          )}
        </Card>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Build Nights</h2>
          <p className="os-muted mt-2">Friday 19:00–22:00. Catch-up, build, demo. No endless talking.</p>
          <div className="mt-4 flex gap-2">
            <Button href="/studio/session" size="sm">
              Open room
            </Button>
            <Button href="/events" size="sm" variant="secondary">
              Events
            </Button>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Collaboration</h2>
          <p className="os-muted mt-2">
            Request work through existing project bids and tasks. Cloudus does not replace those workflows.
          </p>
          <Button href="/projects" className="mt-4" size="sm" variant="secondary">
            View open work
          </Button>
        </Card>
      </div>
    </div>
  );
}
