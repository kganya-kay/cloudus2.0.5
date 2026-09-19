import Link from "next/link";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { Button, Card, EmptyState, PageHeader } from "~/components/os/primitives";

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default async function BlogDirectoryPage() {
  const session = await auth();
  const items = await api.blog.listPublicBlogs({ limit: 36 }).catch(() => []);
  const sessionName = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "my-blog";
  const myBlogHref = `/Blog/${normalizeName(sessionName) || "my-blog"}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learn"
        title="Notes"
        description="Public Cloudus blogs. Writing still lives at /Blog/{username}."
        actions={
          <>
            <Button href={myBlogHref}>My blog</Button>
            <Button href="/learn" variant="secondary">Learn</Button>
          </>
        }
      />
      {items.length === 0 ? (
        <EmptyState title="No public notes yet" description="Publish one lesson or studio experiment." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Link key={item.blog.id} href={`/Blog/${item.blog.userName}`}>
              <Card className="h-full hover:bg-os-elevated">
                <p className="os-kicker">{item.blog.title}</p>
                <h2 className="mt-2 font-semibold">{item.latestPost.title}</h2>
                <p className="os-muted line-clamp-2">{item.latestPost.excerpt ?? "A Cloudus note."}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
