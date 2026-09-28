import { notFound } from "next/navigation";

import { BookReader } from "~/components/blog/BookReader";
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
    <BookReader
      userName={blog.userName}
      bookTitle={blog.title}
      author={post.author.name}
      canManage={result.viewerCanManage}
      post={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        videoUrl: post.videoUrl,
        audioUrl: post.audioUrl,
      }}
    />
  );
}
