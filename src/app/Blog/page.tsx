import { Button, EmptyState, PageHeader } from "~/components/os/primitives";
import { BlogRail } from "~/components/blog/BlogRail";
import { BookShelf } from "~/components/blog/BookShelf";
import { BloggerNav } from "~/components/social/BloggerNav";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function BlogDirectoryPage() {
  const session = await auth();
  const [items, recent] = await Promise.all([
    api.blog.listPublicBlogs({ limit: 36 }).catch(() => []),
    api.blog.listRecentPosts({ limit: 8 }).catch(() => []),
  ]);

  const writeHref = session?.user ? "/Blog/me" : "/auth/login?callbackUrl=/Blog/me";

  return (
    <div className="life-desk space-y-8">
      <PageHeader
        title="Blogs"
        actions={<BloggerNav current="community" />}
      />

      <div className="flex justify-end">
        <Button href={writeHref} size="sm">
          Write
        </Button>
      </div>

      {recent.length > 0 ? (
        <section className="space-y-3">
          <p className="os-kicker">Latest</p>
          <BlogRail
            posts={recent.map((post) => ({
              href: `/Blog/${post.blog.userName}/${post.slug}`,
              title: post.title,
              author: post.blog.owner.name ?? post.blog.userName,
              excerpt: post.excerpt,
              image: post.coverImage,
            }))}
          />
        </section>
      ) : null}

      {items.length === 0 && recent.length === 0 ? (
        <EmptyState title="Empty" action={<Button href={writeHref} size="sm">Write</Button>} />
      ) : items.length > 0 ? (
        <section className="space-y-3">
          <p className="os-kicker">In the book</p>
          <BookShelf
            books={items.map((item) => ({
              href: `/Blog/${item.blog.userName}`,
              title: item.blog.title,
              author: item.blog.owner.name ?? item.blog.userName,
              image: item.latestPost.coverImage,
              chapters: item.publishedPostCount,
            }))}
          />
        </section>
      ) : null}
    </div>
  );
}
