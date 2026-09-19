"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FeedOwn } from "~/components/os/feed-own";
import { StoryOwnerTools } from "~/components/os/story-owner";
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
  const { data: session } = useSession();
  const overview = api.workspace.overview.useQuery(undefined, { retry: false });
  const userId = session?.user?.id;

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Community" />
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
        title="Community"
        hint="Write here. We dress it for the wire."
        actions={
          <>
            <Button href="/Blog">Blogs</Button>
            <Button href="/feed" variant="secondary">
              Feed
            </Button>
          </>
        }
      />

      <CommunityStoryDrop />

      {data?.blogs.length ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Stories</h2>
            <Link href="/Blog" className="text-sm font-semibold text-os-accent">
              All
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {data.blogs.map((post) => (
              <Card key={post.id} className="space-y-3">
                <p className="os-kicker">@{post.blog.userName}</p>
                <h3 className="font-semibold">{post.title}</h3>
                {post.excerpt ? <p className="os-muted line-clamp-1">{post.excerpt}</p> : null}
                <StoryMediaPlayer
                  imageUrl={post.coverImage}
                  videoUrl={post.videoUrl}
                  audioUrl={post.audioUrl}
                  title={post.title}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button href={`/Blog/${post.blog.userName}/${post.slug}`} size="sm" variant="secondary">
                    Read
                  </Button>
                  <StoryOwnerTools
                    canManage={userId === post.blog.ownerId}
                    userName={post.blog.userName}
                    post={{
                      id: post.id,
                      title: post.title,
                      excerpt: post.excerpt,
                      content: null,
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr,1fr]">
        <Card>
          <h2 className="font-display text-lg font-semibold">Creators</h2>
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
            <EmptyState title="None" action={<Button href="/creators/dashboard" size="sm">Create</Button>} />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Activity</h2>
            <Link href="/feed" className="text-sm font-semibold text-os-accent">
              All
            </Link>
          </div>
          {data?.feed.length ? (
            <ul className="mt-4 space-y-3">
              {data.feed.map((item) => (
                <li key={item.id} className="space-y-2 rounded-2xl bg-os-elevated p-3">
                  <p className="text-sm font-medium">{item.title ?? item.caption ?? item.type}</p>
                  <p className="os-muted">@{item.creator.handle}</p>
                  <FeedOwn
                    postId={item.id}
                    title={item.title}
                    caption={item.caption}
                    canManage={userId === item.creator.user.id}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Quiet" />
          )}
        </Card>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Nights</h2>
          <div className="mt-4 flex gap-2">
            <Button href="/studio/session" size="sm">
              Room
            </Button>
            <Button href="/events" size="sm" variant="secondary">
              Events
            </Button>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Work</h2>
          <Button href="/projects" className="mt-4" size="sm" variant="secondary">
            Projects
          </Button>
        </Card>
      </div>
    </div>
  );
}
