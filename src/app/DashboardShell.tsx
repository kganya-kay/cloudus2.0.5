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
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import GetWebApplication from "./_components/getWebApplication";
import TechDest from "./_components/techDest";
import NewProductFlow from "./_components/newProductFlow";
import AllPublicProjects from "./_components/allPublicProjects";
import Special from "./_components/specials";
import Video from "./_components/video";
import NewLead from "./_components/newLead";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "Projects", href: "/projects" },
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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardShell({
  user,
  session,
}: {
  user: { name: string; image: string; email: string };
  session: boolean;
}) {
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* ===== Top App Bar (YouTube-style) ===== */}
      <Disclosure
        as="nav"
        className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70"
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
                <span className="hidden sm:block text-lg font-semibold">
                  Cloudus
                </span>
              </Link>
            </div>

            {/* Center: Search (dominant) */}
            <div className="mx-auto w-full max-w-3xl flex-1">
              <form action="/search" className="flex items-stretch">
                <input
                  type="search"
                  name="q"
                  placeholder="Search Cloudus"
                  className="w-full rounded-l-full border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="rounded-r-full border border-l-0 border-gray-300 px-4 text-gray-700 hover:bg-gray-50"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Right: Notifications + Avatar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon aria-hidden="true" className="h-6 w-6" />
              </button>

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
      <div className="sticky top-16 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
            {tabs.map((t, i) => (
              <button
                key={t.key}
                className={classNames(
                  i === 0
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200",
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
              <section className="rounded-2xl border bg-white p-3 shadow-sm">
                <h3 className="mb-2 px-1 text-sm font-semibold text-gray-700">
                  Quick links
                </h3>
                <nav className="flex flex-col">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="rounded-lg px-2 py-2 text-sm hover:bg-gray-50"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </section>

              {/* Best Suppliers */}
              <section className="rounded-2xl border bg-white p-3 shadow-sm">
                <h3 className="mb-2 px-1 text-sm font-semibold text-gray-700">
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
                      className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-block h-6 w-6 rounded-full bg-gray-200" />
                        <p className="truncate text-sm">{s.name}</p>
                      </div>
                      <span className="rounded-full border px-2 py-0.5 text-xs text-gray-600">
                        {s.tag}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Top Services / Products */}
              <section className="rounded-2xl border bg-white p-3 shadow-sm">
                <h3 className="mb-2 px-1 text-sm font-semibold text-gray-700">
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
                      className="rounded-xl border px-3 py-2 text-center text-xs hover:bg-gray-50"
                    >
                      {p.title}
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </aside>

          {/* Main content — single column feed */}
          <main className="min-h-screen">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome {user.name}</p>
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

            {/* Single-column YouTube-like feed */}
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

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <NewLead />
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm flex justify-center">
                <Video />
              </div>
            </div>

            <div className="h-16" />
          </main>
        </div>
      </div>
    </div>
  );
}
