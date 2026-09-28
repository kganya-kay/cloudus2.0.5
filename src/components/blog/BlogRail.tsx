"use client";

import Link from "next/link";

export type RailPost = {
  href: string;
  title: string;
  author?: string | null;
  excerpt?: string | null;
  image?: string | null;
};

export function BlogRail({ posts }: { posts: RailPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {posts.map((post) => (
        <Link key={post.href} href={post.href} className="os-newsprint-sheet block p-4 transition hover:-translate-y-0.5">
          <p className="os-kicker">{post.author}</p>
          <h3 className="mt-2 font-display text-xl font-semibold leading-tight">{post.title}</h3>
          {post.excerpt ? <p className="os-muted mt-2 line-clamp-2">{post.excerpt}</p> : null}
          {post.image ? (
            <span
              className="mt-3 block h-28 rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${post.image})` }}
            />
          ) : null}
        </Link>
      ))}
    </div>
  );
}
