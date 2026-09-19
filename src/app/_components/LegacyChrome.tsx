"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isOsRoute } from "~/lib/os/nav";
import { FloatingPortalLinks } from "./FloatingPortalLinks";

export function LegacyChrome() {
  const pathname = usePathname() ?? "/";
  if (isOsRoute(pathname)) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 shadow-lg ring-1 ring-stone-200 backdrop-blur dark:bg-zinc-900/80 dark:ring-zinc-700">
        <img src="/cloudus-logo-final.png" alt="" className="h-8 w-8 rounded-full" />
        <Link href="/dashboard" className="text-sm font-semibold text-os-accent">
          Cloudus OS
        </Link>
      </div>
      <FloatingPortalLinks />
    </>
  );
}
