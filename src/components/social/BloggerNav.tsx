"use client";

import {
  ArrowRightOnRectangleIcon,
  BookOpenIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { ReactNode } from "react";

export function BloggerNav({ current }: { current?: "community" | "mine" | "profile" }) {
  const { status } = useSession();
  const signedIn = status === "authenticated";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <IconLink href="/Blog" label="Blogs" current={current === "community"}>
        <BookOpenIcon className="h-5 w-5" />
      </IconLink>
      {signedIn ? (
        <>
          <IconLink href="/Blog/me" label="Write" current={current === "mine"}>
            <PencilSquareIcon className="h-5 w-5" />
          </IconLink>
          <IconLink href="/profile" label="Profile" current={current === "profile"}>
            <UserCircleIcon className="h-5 w-5" />
          </IconLink>
        </>
      ) : (
        <IconLink href="/auth/login?callbackUrl=/Blog/me" label="Sign in">
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </IconLink>
      )}
    </div>
  );
}

function IconLink({
  href,
  label,
  current,
  children,
}: {
  href: string;
  label: string;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={current ? "page" : undefined}
      className={`grid h-11 w-11 place-items-center rounded-full border transition ${
        current
          ? "border-os-fg bg-os-fg text-os-bg dark:bg-white dark:text-zinc-950"
          : "border-os-border bg-os-card text-os-fg hover:bg-os-elevated"
      }`}
    >
      {children}
    </Link>
  );
}
