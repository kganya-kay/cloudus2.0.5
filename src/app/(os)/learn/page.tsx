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
        <PageHeader title="Learn" description="Loading playbooks." />
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
        eyebrow="Knowledge"
        title="Learn"
        description="Engineering notes and story blogs with picture, video, and sound."
        actions={
          <>
            <Button href="/Blog">Public blogs</Button>
            <Button href="/Blog/me" variant="secondary">
              My stories
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
              <p className="os-muted mt-2">{post.excerpt ?? "A Cloudus note."}</p>
              <p className="mt-3 text-xs text-os-muted">{formatShortDate(post.publishedAt)}</p>
              <Button href={`/Blog/${post.blog.userName}`} className="mt-4" size="sm" variant="secondary">
                Read
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No published notes yet"
          description="Document one production lesson or one studio experiment. That is enough for this week."
          action={<Button href="/Blog" size="sm">Write a note</Button>}
        />
      )}
    </div>
  );
}
