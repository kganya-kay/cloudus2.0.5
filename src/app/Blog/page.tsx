import { Button, EmptyState, PageHeader } from "~/components/os/primitives";
import { BookShelf } from "~/components/blog/BookShelf";
import { BloggerNav } from "~/components/social/BloggerNav";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function BlogDirectoryPage() {
  const session = await auth();
  const items = await api.blog.listPublicBlogs({ limit: 36 }).catch(() => []);

  return (
    <div className="life-desk space-y-8">
      <PageHeader
        title="Library"
        actions={<BloggerNav current="community" />}
      />

      {session?.user ? (
        <div className="flex justify-end">
          <Button href="/Blog/me" size="sm">
            My book
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title="Empty"
          action={
            <Button href={session?.user ? "/Blog/me" : "/auth/login?callbackUrl=/Blog/me"} size="sm">
              Write
            </Button>
          }
        />
      ) : (
        <BookShelf
          books={items.map((item) => ({
            href: `/Blog/${item.blog.userName}`,
            title: item.blog.title,
            author: item.blog.owner.name ?? item.blog.userName,
            image: item.latestPost.coverImage,
            chapters: item.publishedPostCount,
          }))}
        />
      )}
    </div>
  );
}
