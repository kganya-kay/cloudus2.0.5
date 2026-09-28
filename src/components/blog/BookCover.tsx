"use client";

import type { CSSProperties } from "react";

type BookCoverProps = {
  title: string;
  author?: string | null;
  image?: string | null;
  chapters?: number;
  size?: "sm" | "md" | "lg";
  foil?: string;
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
}: BookCoverProps) {
  const cloth = foil ?? toneFor(title);
  const sizes = {
    sm: "h-44 w-[7.2rem]",
    md: "h-64 w-[10.5rem]",
    lg: "h-[28rem] w-[18rem] sm:h-[32rem] sm:w-[21rem]",
  };

  return (
    <div className={`life-cover ${sizes[size]}`} style={{ "--book-cloth": cloth } as CSSProperties}>
      <span className="life-cover-spine" />
      <span className="life-cover-ridge" />
      <span
        className={`life-cover-art ${image ? "has-photo" : "life-cover-grain"}`}
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      />
      <div className="life-cover-copy">
        <p className="life-cover-kicker">{chapters > 0 ? String(chapters) : "Life"}</p>
        <h3 className="life-cover-title">{title}</h3>
        {author ? <p className="life-cover-author">{author}</p> : null}
      </div>
    </div>
  );
}
