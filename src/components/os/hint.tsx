"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { type ReactNode } from "react";

export function Hint({
  children,
  label = "Hint",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <Popover className="relative inline-flex">
      <PopoverButton
        className="os-hint-mark"
        aria-label={label}
      >
        i
      </PopoverButton>
      <PopoverPanel className="os-pop absolute right-0 z-50 mt-2 w-60 origin-top-right">
        {children}
      </PopoverPanel>
    </Popover>
  );
}

export function HoverPop({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group/pop relative inline-flex">
      {children}
      <span className="os-pop pointer-events-none absolute left-3 top-full z-40 mt-1 hidden w-44 group-hover/pop:block">
        {label}
      </span>
    </span>
  );
}
