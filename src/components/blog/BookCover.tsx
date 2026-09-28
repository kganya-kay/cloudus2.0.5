"use client";

import type { CSSProperties } from "react";

type BookCoverProps = {
  title: string;
  author?: string | null;
  image?: string | null;
  chapters?: number;
  size?: "sm" | "md" | "lg";
  foil?: string;
  pictorial?: boolean;
};

const tones = ["#6b1f33", "#12263f", "#2f5d50", "#8c6a3a", "#2a2118"];

function toneFor(title: string) {
  let hash = 0;
  for (const char of title) hash = (hash + char.charCodeAt(0)) % tones.length;
  return tones[hash] ?? tones[0];
}

export function BookCover({
  title,
  author,
  image,
  chapters = 0,
  size = "md",
  foil,
  pictorial,
}: BookCoverProps) {
  const cloth = foil ?? toneFor(title);
  const sizes = {
    sm: "h-44 w-[7.2rem]",
    md: "h-64 w-[10.5rem]",
    lg: "h-[28rem] w-[18rem] sm:h-[32rem] sm:w-[21rem]",
  };

  return (
    <div
      className={`life-cover ${sizes[size]} ${pictorial ? "is-pictorial" : ""} ${image ? "has-photo" : ""}`}
      style={{ "--book-cloth": cloth } as CSSProperties}
    >
      <span className="life-cover-spine" />
      <span className="life-cover-ridge" />
      <span
        className={`life-cover-art ${image ? "has-photo" : "life-cover-grain"}`}
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      />
      {pictorial ? (
        image ? null : (
          <span className="life-cover-mark" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
              <path d="M6 4.5A2.5 2.5 0 0 0 3.5 7v11A1.5 1.5 0 0 0 6 19.4V5.6A2.5 2.5 0 0 1 8 4.5H20a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5H8A2.5 2.5 0 0 0 6 20.5h12.5V22H6A4 4 0 0 1 2 18V7A4 4 0 0 1 6 3h14.5v1.5H6z" />
            </svg>
          </span>
        )
      ) : (
        <div className="life-cover-copy">
          <p className="life-cover-kicker">{chapters > 0 ? String(chapters) : "·"}</p>
          <h3 className="life-cover-title">{title}</h3>
          {author ? <p className="life-cover-author">{author}</p> : null}
        </div>
      )}
    </div>
  );
}
