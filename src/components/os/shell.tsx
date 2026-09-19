"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  RectangleStackIcon,
  SparklesIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { desktopNav, isNavActive, mobileNav } from "~/lib/os/nav";
import { useTheme } from "~/lib/os/theme";
import { api } from "~/trpc/react";
import { Avatar, Button } from "./primitives";
import { CommandPalette } from "./command-palette";

const mobileIcons = [HomeIcon, WrenchScrewdriverIcon, SparklesIcon, RectangleStackIcon, UserCircleIcon];

export function OsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const user = session?.user;
  const notifications = api.notification.list.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
  });
  const unread = useMemo(
    () => (notifications.data ?? []).filter((item) => !item.readAt).length,
    [notifications.data],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    const syncOnline = () => setOnline(navigator.onLine);
    window.addEventListener("keydown", onKey);
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    syncOnline();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [pathname]);

  const openSearch = () => {
    setMobileSearchOpen(true);
    setCommandOpen(true);
  };

  const closeSearch = () => {
    setCommandOpen(false);
    setMobileSearchOpen(false);
  };

  const roleLinks = [
    user?.role === "SUPPLIER" || user?.role === "ADMIN" || user?.role === "CARETAKER"
      ? { href: "/suppliers/dashboard", label: "Supplier" }
      : null,
    user?.role === "DRIVER" || user?.role === "ADMIN" || user?.role === "CARETAKER"
      ? { href: "/drivers/dashboard", label: "Driver" }
      : null,
    user?.role === "ADMIN" || user?.role === "CARETAKER"
      ? { href: "/founder", label: "Founder" }
      : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div className="os-app min-h-screen bg-os-bg text-os-fg">
      <a
        href="#os-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-os-card focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-os-border bg-os-elevated/80 px-4 py-6 backdrop-blur lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <img src="/cloudus-logo-final.png" alt="" className="h-9 w-9 rounded-full object-cover" />
          <div>
            <p className="text-sm font-semibold">Cloudus OS</p>
            <p className="text-xs text-os-muted">The place where builders build</p>
          </div>
        </Link>
        <nav aria-label="Cloudus" className="flex-1 space-y-1 overflow-y-auto">
          {desktopNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-3 py-2.5 ${
                isNavActive(pathname, item.href)
                  ? "bg-os-fg text-os-bg dark:bg-white dark:text-zinc-950"
                  : "text-os-muted hover:bg-os-card hover:text-os-fg"
              }`}
            >
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="block text-[11px] opacity-80">{item.description}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-4 space-y-2 border-t border-os-border pt-4">
          {roleLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-2xl px-3 py-2 text-sm text-os-muted hover:bg-os-card">
              {link.label} portal
            </Link>
          ))}
          <p className="px-3 text-[11px] text-os-muted">Press Ctrl/Cmd + K</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-os-border bg-os-bg/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Link href="/" className={`flex items-center gap-2 lg:hidden ${mobileSearchOpen ? "hidden" : ""}`}>
              <img src="/cloudus-logo-final.png" alt="Cloudus" className="h-8 w-8 rounded-full object-cover" />
            </Link>
            {mobileSearchOpen ? (
              <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
                <button
                  type="button"
                  onClick={openSearch}
                  className="flex min-h-11 min-w-0 flex-1 items-center rounded-full border border-os-border bg-os-card px-4 text-left text-sm text-os-muted"
                >
                  Search Cloudus
                </button>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-os-border"
                  aria-label="Close search"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openSearch}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-os-border bg-os-card md:hidden"
                aria-label="Search Cloudus"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden min-h-11 flex-1 items-center rounded-full border border-os-border bg-os-card px-4 text-left text-sm text-os-muted md:flex"
            >
              Search Cloudus
              <span className="ml-auto hidden text-[11px] lg:inline">Ctrl K</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-11 rounded-full border border-os-border px-3 text-xs font-semibold"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            {user ? (
              <Link href="/profile" className="relative rounded-full" aria-label={`${unread} unread notifications`}>
                <BellIcon className="h-6 w-6" />
                {unread > 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-os-danger px-1.5 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>
            ) : null}
            {status === "authenticated" ? (
              <Link href={user?.email ? `/profile/${user.email}` : "/profile"}>
                <Avatar src={user?.image} name={user?.name} />
              </Link>
            ) : (
              <Button href="/auth/login" size="sm">
                Sign in
              </Button>
            )}
          </div>
          {!online ? (
            <p className="px-4 pb-3 text-xs text-os-warning sm:px-6">Offline mode. You can still plan locally.</p>
          ) : null}
        </header>

        <main id="os-main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          {children}
        </main>
      </div>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-os-border bg-os-bg/95 px-2 py-2 backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {mobileNav.map((item, index) => {
            const Icon = mobileIcons[index] ?? HomeIcon;
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold ${
                    active ? "text-os-accent" : "text-os-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <CommandPalette open={commandOpen} onClose={closeSearch} />
    </div>
  );
}
