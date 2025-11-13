"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const DRIVER_LINK = {
  href: "/drivers/dashboard",
  label: "Driver portal",
};

const SUPPLIER_LINK = {
  href: "/suppliers/apply",
  label: "Supplier portal",
};

export function FloatingPortalLinks() {
  const { data } = useSession();
  const role = data?.user?.role;

  const canSeeAll = role === "ADMIN" || role === "CARETAKER";
  const showDriver = canSeeAll || role === "DRIVER";
  const showSupplier = canSeeAll || role === "SUPPLIER";

  const links = [
    showSupplier ? SUPPLIER_LINK : null,
    showDriver ? DRIVER_LINK : null,
  ].filter(Boolean) as { href: string; label: string }[];

  if (links.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm shadow-lg backdrop-blur">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full bg-slate-900 px-4 py-1.5 font-semibold text-white shadow hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
