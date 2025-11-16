import Link from "next/link";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AllShopItems from "../_components/allShopItems";
import { MarketplaceTasksPanel } from "../_components/MarketplaceTasksPanel";

const navigation = [
  { name: "Dashboard", href: "./", current: false },
  { name: "Shop", href: "/shop", current: true },
  { name: "Feed", href: "/feed", current: false },
  { name: "Projects", href: "/projects", current: false },
  { name: "Suppliers", href: "/suppliers/dashboard", current: false },
  { name: "Drivers", href: "/drivers/dashboard", current: false },
  { name: "Creators", href: "/creators/dashboard", current: false },
  { name: "Calendar", href: "/calendar", current: false },
  { name: "Careers", href: "/careers", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default async function Home() {
  await api.post.hello({ text: "from Cloudus" });
  const session = await auth();
  const [announcements, featuredCreators] = await Promise.all([
    api.platform.announcements({ limit: 3 }),
    api.creator.featured(),
  ]);

  const user = {
    name: session?.user.name ?? "Guest",
    image:
      session?.user.image ??
      "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV",
    email: session?.user.email ?? "",
  };

  const userNavigation = [
    { name: "Your Profile", href: "#" },
    { name: "Settings", href: "#" },
    {
      name: session ? "Sign out" : "Sign In",
      href: session ? "/api/auth/signout" : "/api/auth/signin",
    },
  ];

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <div className="min-h-full bg-gray-100">
        {/* Navbar */}
        <Disclosure as="nav" className="sticky top-0 z-50 bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo & Nav */}
              <div className="flex items-center">
                <Link href="./">
                  <img
                    alt="Cloudus"
                    src="https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"
                    className="h-10 w-10 rounded-full"
                  />
                </Link>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        aria-current={item.current ? "page" : undefined}
                        className={classNames(
                          item.current
                            ? "bg-blue-500 text-white"
                            : "text-gray-700 hover:bg-blue-100",
                          "rounded-md px-3 py-2 text-sm font-medium transition",
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right side */}
              <div className="hidden md:flex items-center gap-4">
                <button
                  type="button"
                  className="relative rounded-full bg-gray-100 p-2 text-gray-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" />
                </button>

                {/* Profile dropdown */}
                <Menu as="div" className="relative">
                  <MenuButton className="flex items-center rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <img alt="" src={user.image} className="h-8 w-8 rounded-full" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {userNavigation.map((item) => (
                      <MenuItem key={item.name}>
                        <a
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          {item.name}
                        </a>
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              </div>

              {/* Mobile menu button */}
              <div className="flex md:hidden">
                <DisclosureButton className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <Bars3Icon className="h-6 w-6" />
                </DisclosureButton>
              </div>
            </div>
          </div>

          {/* Mobile Nav */}
          <DisclosurePanel className="md:hidden bg-white shadow">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-blue-100",
                    "block rounded-md px-3 py-2 text-base font-medium",
                  )}
                >
                  {item.name}
                </DisclosureButton>
              ))}
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              <div className="flex items-center px-5">
                <img alt="" src={user.image} className="h-10 w-10 rounded-full" />
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-700">
                    {user.name}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                {userNavigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50"
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </div>
          </DisclosurePanel>
        </Disclosure>

        <header className="bg-gradient-to-br from-white via-blue-50 to-white shadow">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-blue-600">Cloudus shop</p>
              <h1 className="text-3xl font-bold text-gray-900">
                Curated services, powered by the creator marketplace.
              </h1>
              <p className="text-sm text-gray-600">
                Book packaged services and tap into the creator feed to keep your launch, supplier,
                and driver collaborators in sync.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/feed"
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  View creator feed
                </Link>
                <Link
                  href="/projects/create"
                  className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700"
                >
                  Launch a project
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-blue-100 bg-white/80 p-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">ANNOUNCEMENTS</p>
              <ul className="mt-2 space-y-2">
                {(announcements ?? []).map((announcement) => (
                  <li key={announcement.id}>
                    <p className="font-semibold text-gray-900">{announcement.title}</p>
                    <p className="text-xs text-gray-600">{announcement.body}</p>
                  </li>
                ))}
                {(announcements ?? []).length === 0 && (
                  <li className="text-xs text-gray-500">No announcements right now.</li>
                )}
              </ul>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-screen bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-4">
                  <AllShopItems />
                </div>
              </div>
              <div className="space-y-6">
                <section className="rounded-3xl border border-gray-100 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Creator spotlight</p>
                  <div className="mt-3 space-y-3">
                    {(featuredCreators ?? []).slice(0, 3).map((creator) => (
                      <article key={creator.id} className="rounded-2xl border border-blue-50 p-3">
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
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {creator.displayName}
                            </p>
                            <p className="text-xs text-gray-500">@{creator.handle}</p>
                          </div>
                        </div>
                        {creator.tagline && (
                          <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                            {creator.tagline}
                          </p>
                        )}
                      </article>
                    ))}
                    {(featuredCreators ?? []).length === 0 && (
                      <p className="text-xs text-gray-500">
                        No creator stories yet. Visit{" "}
                        <Link href="/feed" className="text-blue-600 underline">
                          the feed
                        </Link>{" "}
                        to meet the community.
                      </p>
                    )}
                  </div>
                </section>

                <MarketplaceTasksPanel role="CREATOR" limit={4} title="Tasks matching shop orders" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
