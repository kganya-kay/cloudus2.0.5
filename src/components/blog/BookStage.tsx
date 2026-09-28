"use client";

import { type ReactNode } from "react";

import { BookCover } from "./BookCover";

type BookStageProps = {
  title: string;
  author?: string | null;
  image?: string | null;
  chapters?: number;
  open?: boolean;
  binding?: boolean;
  turning?: boolean;
  children?: ReactNode;
  onCoverClick?: () => void;
  onLeafClick?: (side: "left" | "right") => void;
};

export function BookStage({
  title,
  author,
  image,
  chapters = 0,
  open = false,
  binding = false,
  turning = false,
  children,
  onCoverClick,
  onLeafClick,
}: BookStageProps) {
  return (
    <div className={`life-book ${open ? "is-open" : ""} ${binding ? "is-binding" : ""}`}>
      <div className="life-book-shadow" />
      <div className="life-book-stage">
        <button
          type="button"
          className="life-book-cover"
          onClick={onCoverClick}
          aria-label={open ? "Close book" : "Open book"}
        >
          <BookCover title={title} author={author} image={image} chapters={chapters} size="lg" />
        </button>
        <div className={`life-book-pages ${turning ? "is-turning" : ""}`}>
          <div className="life-book-gutter" />
          <div
            className="life-book-leaf"
            onClick={(event) => {
              if (!onLeafClick) return;
              const target = event.target as HTMLElement;
              if (target.closest("input, textarea, button, a, .book-canvas")) return;
              const rect = event.currentTarget.getBoundingClientRect();
              onLeafClick(event.clientX - rect.left > rect.width / 2 ? "right" : "left");
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
