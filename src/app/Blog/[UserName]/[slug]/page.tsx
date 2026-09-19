import { notFound } from "next/navigation";

import { Badge, Button, Card, PageHeader } from "~/components/os/primitives";
import { BloggerNav } from "~/components/social/BloggerNav";
import { PostToSocials } from "~/components/social/PostToSocials";
import { StoryMediaPlayer } from "~/components/social/StoryMediaPlayer";
import { formatDateTime } from "~/lib/os/format";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

type PageProps = {
  params: Promise<{ UserName: string; slug: string }>;
};

export default async function BlogStoryPage({ params }: PageProps) {
  const { UserName, slug } = await params;
  const userName = decodeURIComponent(UserName);
  const session = await auth();

  const result = await api.blog
    .getPostBySlug({
      userName,
      slug,
      includeDraft: Boolean(session?.user),
    })
    .catch(() => null);

  if (!result?.post) notFound();

  const { post, blog } = result;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={post.title}
        actions={<BloggerNav />}
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={post.status === "PUBLISHED" ? "success" : "default"}>{post.status}</Badge>
          <span className="text-xs text-os-muted">{formatDateTime(post.publishedAt)}</span>
        </div>
        <StoryMediaPlayer
          imageUrl={post.coverImage}
          videoUrl={post.videoUrl}
          audioUrl={post.audioUrl}
          title={post.title}
        />
        {post.content ? <p className="whitespace-pre-wrap leading-7">{post.content}</p> : null}
      </Card>

      <div className="flex flex-wrap gap-2">
        {result.viewerCanManage ? (
          <PostToSocials
            title={post.title}
            excerpt={post.excerpt}
            content={post.content}
            imageUrl={post.coverImage}
            videoUrl={post.videoUrl}
            audioUrl={post.audioUrl}
            permalink={`/Blog/${blog.userName}/${post.slug}`}
            prefetch
          />
        ) : null}
        <Button href={`/Blog/${blog.userName}`} size="sm" variant="secondary">
          More
        </Button>
        <Button href="/Blog" size="sm" variant="ghost">
          All
        </Button>
      </div>
    </div>
  );
}
