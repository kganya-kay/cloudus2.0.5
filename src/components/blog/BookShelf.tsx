"use client";

import Link from "next/link";

import { BookCover } from "./BookCover";

export type ShelfBook = {
  href: string;
  title: string;
  author?: string | null;
  image?: string | null;
  chapters?: number;
};

export function BookShelf({ books }: { books: ShelfBook[] }) {
  if (books.length === 0) return null;

  return (
    <div className="life-shelf">
      <div className="life-shelf-row">
        {books.map((book) => (
          <Link key={book.href} href={book.href} className="life-shelf-item" title={book.title}>
            <BookCover
              title={book.title}
              author={book.author}
              image={book.image}
              chapters={book.chapters}
              size="sm"
            />
          </Link>
        ))}
      </div>
      <div className="life-shelf-plank" />
    </div>
  );
}
