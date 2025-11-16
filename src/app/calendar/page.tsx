import Link from "next/link";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import {
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import jsforce from "jsforce";

import { MarketplaceTasksPanel } from "~/app/_components/MarketplaceTasksPanel";
import { auth } from "~/server/auth";
import { HydrateClient, api } from "~/trpc/server";

interface SalesforceEvent {
  Id: string;
  Subject: string;
  StartDateTime: string;
}

const conn = new jsforce.Connection();
await conn.login("kganyaomnistudio@gmail.com", "542692kK.");
const res = await conn.query<SalesforceEvent>(
  "SELECT Id, Subject, StartDateTime FROM Event",
);

function eachDayOfInterval(interval: { start: Date; end: Date }): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(interval.start);
  while (cursor <= interval.end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

const navigation = [
  { name: "Dashboard", href: "./", current: false },
  { name: "Shop", href: "/shop", current: false },
  { name: "Feed", href: "/feed", current: false },
  { name: "Projects", href: "/projects", current: false },
  { name: "Suppliers", href: "/suppliers/dashboard", current: false },
  { name: "Drivers", href: "/drivers/dashboard", current: false },
  { name: "Creators", href: "/creators/dashboard", current: false },
  { name: "Calendar", href: "/calendar", current: true },
  { name: "Careers", href: "/careers", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default async function CalendarPage() {
  await api.post.hello({ text: "from Cloudus" });
  const session = await auth();
  const [announcements, feedPreview] = await Promise.all([
    api.platform.announcements({ limit: 3 }),
    api.feed.list({ limit: 4 }),
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

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days: Date[] = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });
  const events: SalesforceEvent[] = res.records;

  return (
    <HydrateClient>
      <div className="min-h-full bg-gray-100">
        <Disclosure as="nav" className="sticky top-0 z-50 bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
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

              <div className="hidden md:flex items-center gap-4">
                <button
                  type="button"
                  className="relative rounded-full bg-gray-100 p-2 text-gray-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" />
                </button>
                <Menu as="div" className="relative">
                  <MenuButton className="flex items-center rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <img alt="" src={user.image} className="h-8 w-8 rounded-full" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {userNavigation.map((item) => (
                      <MenuItem key={item.name}>
                        <a
                          href={item.href}
                          className="block px-4 py-2 text-sm hover:bg-blue-50"
                        >
                          {item.name}
                        </a>
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              </div>

              <div className="-mr-2 flex md:hidden">
                <DisclosureButton className="relative inline-flex items-center justify-center rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className="md:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
              {navigation.map((item) => (
                <DisclosureButton
                  key={item.name}
                  as={Link}
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
          </DisclosurePanel>
        </Disclosure>

        <section className="relative isolate bg-gradient-to-br from-blue-700 via-purple-600 to-indigo-600 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle,_rgba(255,255,255,0.35),_transparent_70%)]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Operations calendar</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
              Align deliveries, bids, and enterprise projects in one view.
            </h1>
            <p className="mt-3 text-sm text-white/80">
              This board blends Salesforce events with Cloudus marketplace tasks, so caretakers,
              suppliers, and creators never miss a milestone.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30"
              >
                View feed
              </Link>
              <Link
                href="/suppliers/dashboard"
                className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                Supplier ops
              </Link>
              <Link
                href="/creators/dashboard"
                className="rounded-full bg-indigo-900/40 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-900/60"
              >
                Creator control room
              </Link>
            </div>
          </div>
        </section>

        <main className="bg-gray-100 pb-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:px-8">
            <div className="space-y-6">
              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Calendar</p>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {format(today, "MMMM yyyy")}
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500">
                    Synced with Salesforce • {events.length} records
                  </p>
                </header>
                <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {days.map((day) => {
                    const dayEvents = events.filter((event) =>
                      isSameDay(new Date(event.StartDateTime), day),
                    );
                    return (
                      <div
                        key={day.toISOString()}
                        className={classNames(
                          "min-h-[90px] rounded-xl border p-2 text-xs",
                          isSameMonth(day, today)
                            ? "bg-gray-50 text-gray-800"
                            : "bg-gray-100 text-gray-400",
                        )}
                      >
                        <span className="font-semibold">{format(day, "d")}</span>
                        <div className="mt-1 space-y-1">
                          {dayEvents.map((event) => (
                            <span
                              key={event.Id}
                              className="block truncate rounded bg-blue-100 px-1 text-[11px] text-blue-700"
                            >
                              {event.Subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Timeline</p>
                    <h2 className="text-lg font-semibold text-gray-900">Upcoming milestones</h2>
                  </div>
                  <Link href="/projects" className="text-xs font-semibold text-blue-700">
                    Projects
                  </Link>
                </header>
                <ul className="mt-4 space-y-4">
                  {events
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(a.StartDateTime).getTime() -
                        new Date(b.StartDateTime).getTime(),
                    )
                    .map((record) => (
                      <li key={record.Id} className="flex items-start gap-3">
                        <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.Subject}</p>
                          <p className="text-xs text-gray-500">
                            {format(
                              new Date(record.StartDateTime),
                              "EEE, MMM d · h:mm a",
                            )}
                          </p>
                        </div>
                      </li>
                    ))}
                </ul>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-blue-100 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-600">
                      Announcements
                    </p>
                    <p className="text-sm text-gray-600">Cloudus control room</p>
                  </div>
                  <Link href="/admin" className="text-xs font-semibold text-blue-700">
                    Admin
                  </Link>
                </div>
                {announcements.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No active announcements.</p>
                ) : (
                  <div className="mt-3 space-y-3 text-sm">
                    {announcements.map((announcement) => (
                      <article
                        key={announcement.id}
                        className="rounded-2xl border border-blue-50 bg-blue-50/60 p-3"
                      >
                        <p className="text-xs uppercase text-blue-700">{announcement.title}</p>
                        <p className="text-gray-600">{announcement.body}</p>
                        {announcement.link && (
                          <Link
                            href={announcement.link}
                            className="mt-1 inline-flex text-xs font-semibold text-blue-700"
                          >
                            Details
                          </Link>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-purple-600">Feed</p>
                    <p className="text-sm text-gray-600">Recent creator drops</p>
                  </div>
                  <Link href="/feed" className="text-xs font-semibold text-purple-700">
                    Feed
                  </Link>
                </div>
                {feedPreview.items.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
                    No new posts. Visit{" "}
                    <Link href="/feed" className="text-blue-600 underline">
                      the feed
                    </Link>{" "}
                    to publish.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {feedPreview.items.slice(0, 3).map((post) => (
                      <article
                        key={post.id}
                        className="rounded-2xl border border-purple-50 bg-purple-50/40 p-3 text-sm"
                      >
                        <p className="text-xs uppercase text-purple-600">
                          {post.type.replaceAll("_", " ")}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {post.title ?? post.project?.name ?? "Update"}
                        </p>
                        {post.caption && (
                          <p className="text-xs text-gray-600 line-clamp-2">{post.caption}</p>
                        )}
                        {post.project?.id && (
                          <Link
                            href={`/projects/${post.project.id}`}
                            className="mt-1 inline-flex text-xs font-semibold text-purple-700"
                          >
                            View project →
                          </Link>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <MarketplaceTasksPanel
                role="CREATOR"
                limit={4}
                title="Marketplace tasks"
                subtitle="Align contributors with project dates."
              />
            </aside>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
