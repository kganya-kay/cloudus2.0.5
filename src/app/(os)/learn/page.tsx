"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { formatShortDate } from "~/lib/os/format";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonGrid,
} from "~/components/os/primitives";

export default function LearnPage() {
  const overview = api.workspace.overview.useQuery(undefined, { retry: false });

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Learn" />
        <SkeletonGrid />
      </div>
    );
  }

  if (overview.error) {
    return <ErrorState onRetry={() => void overview.refetch()} />;
  }

  const posts = overview.data?.blogs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learn"
        actions={
          <>
            <Button href="/Blog">Blogs</Button>
            <Button href="/Blog/me" variant="secondary">
              Mine
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Articles", href: "/Blog" },
          { title: "Careers", href: "/careers" },
          { title: "Team", href: "/team" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="os-card p-4 font-semibold">
            {item.title}
          </Link>
        ))}
      </div>

      {posts.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <Card key={post.id}>
              <p className="os-kicker">{post.blog.title}</p>
              <h2 className="mt-2 text-lg font-semibold">{post.title}</h2>
              {post.excerpt ? <p className="os-muted mt-2 line-clamp-1">{post.excerpt}</p> : null}
              <p className="mt-3 text-xs text-os-muted">{formatShortDate(post.publishedAt)}</p>
              <Button href={`/Blog/${post.blog.userName}`} className="mt-4" size="sm" variant="secondary">
                Read
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Empty" action={<Button href="/Blog" size="sm">Write</Button>} />
      )}
    </div>
  );
}
