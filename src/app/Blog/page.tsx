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
        title="Blogs"
        actions={<BloggerNav current="community" />}
      />

      {session?.user ? (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold">{session.user.name ?? "You"}</p>
          <Button href="/Blog/me" size="sm">
            Mine
          </Button>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Empty"
          action={<Button href={session?.user ? "/Blog/me" : "/auth/login?callbackUrl=/Blog/me"} size="sm">Write</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Link key={item.blog.id} href={`/Blog/${item.blog.userName}/${item.latestPost.slug}`}>
              <Card className="h-full space-y-3 hover:bg-os-elevated">
                <p className="os-kicker">@{item.blog.userName}</p>
                <h2 className="font-semibold">{item.latestPost.title}</h2>
                {item.latestPost.excerpt ? <p className="os-muted line-clamp-1">{item.latestPost.excerpt}</p> : null}
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
