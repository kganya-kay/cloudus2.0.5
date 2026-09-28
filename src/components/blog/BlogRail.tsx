"use client";

import { BookShelf } from "./BookShelf";

export type RailPost = {
  href: string;
  title: string;
  author?: string | null;
  excerpt?: string | null;
  image?: string | null;
};

export function BlogRail({ posts }: { posts: RailPost[] }) {
  return (
    <BookShelf
      books={posts.map((post) => ({
        href: post.href,
        title: post.title,
        author: post.author,
        image: post.image,
      }))}
    />
  );
}
