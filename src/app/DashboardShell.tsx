// app/(dashboard)/DashboardShell.tsx — CLIENT COMPONENT
"use client";

import Link from "next/link";
import Button from "@mui/material/Button";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
} from "@heroicons/react/24/outline";

import GetWebApplication from "./_components/getWebApplication";
import TechDest from "./_components/techDest";
import NewProductFlow from "./_components/newProductFlow";
import AllPublicProjects from "./_components/allPublicProjects";
import Special from "./_components/specials";
import Video from "./_components/video";
import NewLead from "./_components/newLead";
import AllShopItems from "./_components/allShopItems";
import OpenProjectsCard from "./_components/openProjectsCard";
import LaundryDetails from "./_components/laundryDetails";
import { AssistantSearchBar } from "./_components/AssistantSearchBar";
import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { MarketplaceTasksPanel } from "./_components/MarketplaceTasksPanel";
import type { RouterOutputs } from "~/trpc/react";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Feed", href: "/feed" },
  { name: "Projects", href: "/projects" },
  { name: "Shop", href: "/shop" },
  { name: "Suppliers", href: "/suppliers/dashboard" },
  { name: "Drivers", href: "/drivers/dashboard" },
  { name: "Creators", href: "/creators/dashboard" },
  { name: "Team", href: "/team" },
  { name: "Calendar", href: "/calendar" },
  { name: "Careers", href: "/careers" },
];

const tabs = [
  { name: "All", key: "All" },
  { name: "Your Projects", key: "projects" },
  { name: "Open", key: "open" },
  { name: "Shop", key: "shop" },
  { name: "Laundry", key: "laundry" },
  { name: "Food", key: "food" },
];

type FeaturedCreator = RouterOutputs["creator"]["featured"][number];
type Announcement = RouterOutputs["platform"]["announcements"][number];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardShell({
  user,
  session,
  featuredCreators,
  announcements,
}: {
  user: { name: string; image: string; email: string };
  session: boolean;
  featuredCreators: FeaturedCreator[];
  announcements: Announcement[];
}) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const notificationsQuery = api.notification.list.useQuery(undefined, {
    enabled: session,
    refetchInterval: session ? 45000 : false,
  });
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications],
  );
  const markAllRead = api.notification.markAllRead.useMutation({
    onSuccess: () => {
      void notificationsQuery.refetch();
    },
  });
  const markRead = api.notification.markRead.useMutation({
    onSuccess: () => {
      void notificationsQuery.refetch();
    },
  });
  const formatTime = (value: string | Date): string => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return typeof value === "string" ? value : value.toISOString();
    }
  };
  const handleNotificationClick = (id: string) => {
    markRead.mutate({ id });
  };
  const userNavigation = [
    { name: "Your Profile", href: `/profile/${user.email}` },
    { name: "Settings", href: "/admin" },
    { name: "Admin", href: "/admin" },
    {
      name: session ? "Sign out" : "Sign In",
      href: session ? "/api/auth/signout" : "/api/auth/signin",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-gray-900">
      {/* ===== Top App Bar (YouTube-style) ===== */}
      <Disclosure
        as="nav"
        className="sticky top-0 z-50 border-b border-blue-100 bg-gradient-to-r from-white/90 via-blue-50/60 to-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70"
      >
        <div className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-3">
            {/* Left: Hamburger + Logo (no compact links anymore) */}
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex lg:hidden">
                <DisclosureButton className="rounded-full p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </DisclosureButton>
              </div>

              <Link href="/" className="flex items-center gap-2 shrink-0">
                <img
                  alt="Cloudus"
                  src="https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"
                  className="h-8 w-8 rounded-full bg-gray-700 object-cover"
                />
                <span className="hidden sm:block text-lg font-semibold text-blue-700">
                  Cloudus
                </span>
              </Link>
            </div>

            {/* Center: Search (dominant) */}
            <div className="mx-auto w-full max-w-3xl flex-1">
              <AssistantSearchBar />
            </div>

            {/* Right: Notifications + Avatar */}
            <div className="flex items-center gap-2">
              {session ? (
                <Menu as="div" className="relative">
                  <MenuButton className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </MenuButton>
                  <MenuItems className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-2xl border border-blue-100 bg-white shadow-xl focus:outline-none">
                    <div className="flex items-center justify-between px-4 py-2">
                      <p className="text-sm font-semibold text-gray-900">Notifications</p>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllRead.mutate()}
                          disabled={markAllRead.isPending}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 divide-y overflow-y-auto">
                      {notificationsQuery.isLoading ? (
                        <p className="px-4 py-6 text-sm text-gray-500">Loading notifications...</p>
                      ) : notifications.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-500">You're all caught up.</p>
                      ) : (
                        notifications.map((notification) => (
                          <MenuItem key={notification.id}>
                            {({ close }) => (
                              <button
                                type="button"
                                onClick={() => {
                                  handleNotificationClick(notification.id);
                                  close();
                                }}
                                className={`w-full px-4 py-3 text-left text-sm transition hover:bg-blue-50 ${notification.readAt ? "bg-white" : "bg-emerald-50"}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-gray-900">{notification.title}</p>
                                  <span className="text-xs text-gray-500">
                                    {formatTime(notification.createdAt as Date)}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">{notification.body}</p>
                              </button>
                            )}
                          </MenuItem>
                        ))
                      )}
                    </div>
                  </MenuItems>
                </Menu>
              ) : (
                <button
                  type="button"
                  className="relative rounded-full p-2 text-gray-400"
                  aria-label="Notifications"
                >
                  <BellIcon aria-hidden="true" className="h-6 w-6" />
                </button>
              )}

              <Menu as="div" className="relative">
                <MenuButton className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <img alt="" src={user.image} className="h-8 w-8 rounded-full" />
                </MenuButton>
                <MenuItems className="absolute right-0 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                  {userNavigation.map((item) => (
                    <MenuItem key={item.name}>
                      <a
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {item.name}
                      </a>
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        <DisclosurePanel className="lg:hidden border-t bg-white shadow-sm">
          <div className="space-y-1 px-3 pb-3 pt-2">
            {navigation.map((item) => (
              <DisclosureButton
                key={item.name}
                as="a"
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                {item.name}
              </DisclosureButton>
            ))}
          </div>
        </DisclosurePanel>
      </Disclosure>

      {/* ===== Sticky Tabs Bar (below app bar) ===== */}
      <div className="sticky top-16 z-40 border-b border-blue-100 bg-gradient-to-r from-white/90 via-blue-50/40 to-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={classNames(
                  activeTab === t.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-blue-50 text-blue-800 hover:bg-blue-100",
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Layout: Left Tools Sidebar + Main ===== */}
      <div className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 py-6">
          {/* Left tools (sticky) */}
          <aside className="hidden lg:block">
            <div className="sticky top-[116px] flex max-h-[calc(100vh-140px)] flex-col gap-6 overflow-auto pr-1">
              {/* Quick Links: now includes ALL nav links */}
              <section className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
                <h3 className="mb-2 px-1 text-sm font-semibold text-blue-700">
                  Quick links
                </h3>
                <nav className="flex flex-col">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="rounded-lg px-2 py-2 text-sm hover:bg-blue-50"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </section>

              {/* Best Suppliers */}
              <section className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
                <h3 className="mb-2 px-1 text-sm font-semibold text-blue-700">
                  Cloudus Powered Services
                </h3>
                <ul className="space-y-2">
                  {[
                    { name: "Liberty Print Co.", tag: "Printing" },
                    { name: "Viking Films", tag: "Video" },
                    { name: "Gabe Mobile Auto", tag: "Auto" },
                    { name: "Jeneo Resources", tag: "Mining" },
                    { name: "Cloudus Vendors", tag: "Tech" },
                    { name: "Cloudus Laundry", tag: "Laundry" },
                  ].map((s) => (
                    <li
                      key={s.name}
                      className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-blue-50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-block h-6 w-6 rounded-full bg-blue-200" />
                        <p className="truncate text-sm">{s.name}</p>
                      </div>
                      <span className="rounded-full border border-blue-200 px-2 py-0.5 text-xs text-blue-700">
                        {s.tag}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Top Services / Products */}
              <section className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm">
                <h3 className="mb-2 px-1 text-sm font-semibold text-blue-700">
                  Top Services / Products
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { title: "CRM Setup", href: "/services/crm" },
                    { title: "Salesforce Impl.", href: "/services/salesforce" },
                    { title: "Web Apps", href: "/services/webapps" },
                    { title: "Online Stores", href: "/services/ecommerce" },
                    { title: "Integrations", href: "/services/integrations" },
                    { title: "Branding Pack", href: "/services/branding" },
                  ].map((p) => (
                    <Link
                      key={p.title}
                      href={p.href}
                      className="rounded-xl border border-blue-100 px-3 py-2 text-center text-xs hover:bg-blue-50"
                    >
                      {p.title}
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </aside>

          {/* Main content – tabbed sections */}
          <main className="min-h-screen">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-blue-700">Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome {user.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {session ? (
                  <Button
                    href="/projects/create"
                    className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    + New Project
                  </Button>
                ) : (
                  <Button
                    href="/api/auth/signin"
                    className="rounded-full bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
                  >
                    Login
                  </Button>
                )}
              </div>
            </div>

            <CreatorSpotlight creators={featuredCreators} announcements={announcements} />

            {/* Content switch */}
            <ContentSwitch activeTab={activeTab} />

            <div className="h-16" />
          </main>
        </div>
      </div>
    </div>
  );
}

function CreatorSpotlight({
  creators,
  announcements,
}: {
  creators: FeaturedCreator[];
  announcements: Announcement[];
}) {
  if (creators.length === 0 && announcements.length === 0) {
    return null;
  }
  return (
    <section className="mt-6 grid gap-4 rounded-3xl border border-blue-100 bg-white/80 p-4 shadow-sm lg:grid-cols-[2fr,1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Creator spotlight</p>
            <h3 className="text-base font-semibold text-gray-900">Top collaborators</h3>
          </div>
          <Link href="/feed" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View feed →
          </Link>
        </div>
        <div className="overflow-hidden">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 no-scrollbar">
          {creators.slice(0, 6).map((creator) => (
            <article
              key={creator.id}
              className="min-w-[210px] max-w-[240px] snap-start rounded-2xl border border-blue-50 bg-blue-50/60 p-3 text-sm text-gray-700 shadow-[0_6px_18px_rgba(59,130,246,0.08)]"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    creator.avatarUrl ??
                    creator.user?.image ??
                    "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV"
                  }
                  alt={creator.displayName}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{creator.displayName}</p>
                  <p className="text-xs text-gray-500">@{creator.handle}</p>
                </div>
              </div>
              {creator.tagline && (
                <p className="mt-2 line-clamp-2 text-xs text-gray-600">{creator.tagline}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1 text-[10px] uppercase text-blue-700">
                {creator.skills.slice(0, 2).map((skill) => (
                  <span key={skill} className="rounded-full bg-white px-2 py-0.5">
                    {skill}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {creators.length === 0 && (
            <div className="min-w-[240px] rounded-2xl border border-dashed border-blue-200 p-3 text-sm text-gray-500">
              No creator stories yet. Head to the{" "}
              <Link href="/feed" className="text-blue-600 underline">
                feed
              </Link>{" "}
              to share one.
            </div>
          )}
          </div>
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-dashed border-gray-200 p-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">Announcements</p>
        {announcements.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing new right now.</p>
        ) : (
          announcements.slice(0, 3).map((announcement) => (
            <div key={announcement.id} className="rounded-xl bg-gray-50 p-3">
              <p className="text-sm font-semibold text-gray-900">{announcement.title}</p>
              <p className="text-xs text-gray-600">{announcement.body}</p>
              {announcement.link && (
                <Link
                  href={announcement.link}
                  className="mt-1 inline-flex text-xs font-semibold text-blue-600"
                >
                  Details →
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ContentSwitch({ activeTab }: { activeTab: string }) {
  switch (activeTab) {
    case "laundry":
      return (
        <div className="mt-6">
          <LaundryDetails />
        </div>
      );
    case "food":
      return (
        <div className="mt-6 space-y-6">
          <Special />
        </div>
      );
    case "projects":
      return (
        <div className="mt-6 space-y-6">
          <OpenProjectsCard />
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <AllPublicProjects />
          </div>
        </div>
      );
    case "shop":
      return (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <AllShopItems />
          </div>
        </div>
      );
    case "open":
      return (
        <div className="mt-6">
          <OpenProjectsCard />
        </div>
      );
    case "All":
    default:
      return (
        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <GetWebApplication />
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <TechDest />
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <NewProductFlow />
          </div>

          <Special />

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <AllPublicProjects />
          </div>

          <MarketplaceTasksPanel role="CREATOR" title="Marketplace tasks" />

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <NewLead />
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm flex justify-center">
            <Video />
          </div>
        </div>
      );
  }
}

// no extra hook; state is lifted to DashboardShell
