"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const HOOKS = ["Make the Daily", "Drop yours", "Ship tonight", "Heard here"];

export function DailyEar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % HOOKS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Link
      href="/community"
      className="flex min-h-8 min-w-0 flex-1 items-center justify-end"
      aria-label="Make the Daily"
    >
      <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-os-fg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-os-bg">
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-os-bg/70" />
        <span className="truncate">{HOOKS[index]}</span>
      </span>
    </Link>
  );
}
