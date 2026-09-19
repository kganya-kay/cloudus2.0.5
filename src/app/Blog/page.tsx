import Link from "next/link";

import { Button, Card, EmptyState, PageHeader } from "~/components/os/primitives";
import { BloggerNav } from "~/components/social/BloggerNav";
import { StoryMediaPlayer } from "~/components/social/StoryMediaPlayer";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function BlogDirectoryPage() {
  const session = await auth();
  const items = await api.blog.listPublicBlogs({ limit: 36 }).catch(() => []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Blogs"
        description="Stories told with pictures, video, and sound. Read everyone. Write yours after you sign in."
        actions={<BloggerNav current="community" />}
      />

      {session?.user ? (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">You are in as {session.user.name ?? "a blogger"}</p>
            <p className="os-muted">Your profile, your stories, and this public list stay in one place.</p>
          </div>
          <Button href="/Blog/me" size="sm">
            Open my blog
          </Button>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="No public stories yet"
          description="Be the first to drop a picture, a clip, or a voice note."
          action={<Button href={session?.user ? "/Blog/me" : "/auth/login?callbackUrl=/Blog/me"} size="sm">Write a story</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Link key={item.blog.id} href={`/Blog/${item.blog.userName}/${item.latestPost.slug}`}>
              <Card className="h-full space-y-3 hover:bg-os-elevated">
                <p className="os-kicker">@{item.blog.userName}</p>
                <h2 className="font-semibold">{item.latestPost.title}</h2>
                <p className="os-muted line-clamp-2">{item.latestPost.excerpt ?? item.blog.description ?? "A Cloudus story."}</p>
                <StoryMediaPlayer
                  imageUrl={item.latestPost.coverImage}
                  videoUrl={item.latestPost.videoUrl}
                  audioUrl={item.latestPost.audioUrl}
                  title={item.latestPost.title}
                />
                <p className="text-xs text-os-muted">{item.publishedPostCount} published</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
