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

import { MarketplaceTasksPanel } from "~/app/_components/MarketplaceTasksPanel";
import { auth } from "~/server/auth";
import { HydrateClient, api } from "~/trpc/server";

interface ActivationEvent {
  id: string;
  name: string;
  business: string;
  location: string;
  startDateTime: string;
  category: string;
  status: "Open call" | "Confirmed" | "Content live";
  contentTypes: string[];
  contentCount: number;
}

const activationEvents: ActivationEvent[] = [
  {
    id: "activation-1",
    name: "Mic Check Podcast Pop-Up",
    business: "Marina Coffee Lab",
    location: "Cape Town, SA",
    startDateTime: "2026-02-04T18:00:00.000Z",
    category: "Podcast",
    status: "Confirmed",
    contentTypes: ["clips", "portraits", "soundbites"],
    contentCount: 12,
  },
  {
    id: "activation-2",
    name: "Vibe Coding Sprint",
    business: "Stackhouse Studios",
    location: "Johannesburg, SA",
    startDateTime: "2026-02-07T14:00:00.000Z",
    category: "Vibe coding",
    status: "Open call",
    contentTypes: ["b-roll", "screenshares", "snippets"],
    contentCount: 8,
  },
  {
    id: "activation-3",
    name: "City Lights Photoshoot",
    business: "Studio 47",
    location: "Durban, SA",
    startDateTime: "2026-02-10T16:00:00.000Z",
    category: "Photoshoot",
    status: "Confirmed",
    contentTypes: ["lookbook", "shorts", "social kits"],
    contentCount: 16,
  },
  {
    id: "activation-4",
    name: "Night Market Gaming Tourney",
    business: "Arcade Alley",
    location: "Pretoria, SA",
    startDateTime: "2026-02-12T17:30:00.000Z",
    category: "Gaming",
    status: "Content live",
    contentTypes: ["highlights", "reels", "stickers"],
    contentCount: 22,
  },
  {
    id: "activation-5",
    name: "Checkmate Social",
    business: "Urban Roof Club",
    location: "Cape Town, SA",
    startDateTime: "2026-02-15T12:00:00.000Z",
    category: "Chess",
    status: "Open call",
    contentTypes: ["portraits", "stories", "snapshots"],
    contentCount: 6,
  },
  {
    id: "activation-6",
    name: "Creator Co-Lab Jam",
    business: "Signal House",
    location: "Johannesburg, SA",
    startDateTime: "2026-02-20T15:00:00.000Z",
    category: "Collaborative",
    status: "Confirmed",
    contentTypes: ["collabs", "interviews", "shorts"],
    contentCount: 10,
  },
];

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
  { name: "Rentals", href: "/rooms", current: false },
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
  const session = await auth();
  const [feedPreview] = await Promise.all([api.feed.list({ limit: 4 })]);

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
  const events: ActivationEvent[] = activationEvents;
  const upcomingEvents = events
    .slice()
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime(),
    );

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

        <section className="relative isolate bg-gradient-to-br from-slate-900 via-emerald-700 to-amber-500 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle,_rgba(255,255,255,0.35),_transparent_70%)]" />
          </div>
          <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              Activation calendar
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
              Host activations at local businesses and publish content for everyone.
            </h1>
            <p className="mt-3 text-sm text-white/80">
              We schedule podcasts, photoshoots, vibe coding, chess tournaments, gaming nights, and
              more. Every activation ships a content drop for the community to reuse.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30"
              >
                Browse content drops
              </Link>
              <Link
                href="/projects/create"
                className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                Propose an activation
              </Link>
              <Link
                href="/creators/dashboard"
                className="rounded-full bg-slate-900/40 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900/60"
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
                  <p className="text-xs text-gray-500">{events.length} activations queued</p>
                </header>
                <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {days.map((day) => {
                    const dayEvents = events.filter((event) =>
                      isSameDay(new Date(event.startDateTime), day),
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
                          {dayEvents.slice(0, 2).map((event) => (
                            <span
                              key={event.id}
                              className="block truncate rounded bg-emerald-100 px-1 text-[11px] text-emerald-700"
                            >
                              {event.business}
                            </span>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="block text-[11px] text-gray-500">
                              +{dayEvents.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Activation flow</p>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Upcoming activations
                    </h2>
                  </div>
                  <Link href="/feed" className="text-xs font-semibold text-emerald-700">
                    Content vault
                  </Link>
                </header>
                <ul className="mt-4 space-y-4">
                  {upcomingEvents.map((record) => (
                    <li key={record.id} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{record.name}</p>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                            {record.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            {record.business} - {record.location} - {record.category}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(record.startDateTime), "EEE, MMM d h:mm a")}
                          </p>
                          <p className="mt-1 text-xs text-emerald-700">
                            {record.contentCount} content drops - {record.contentTypes.join(", ")}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-600">
                      Activation brief
                    </p>
                    <p className="text-sm text-gray-600">How we show up on site</p>
                  </div>
                  <Link href="/projects" className="text-xs font-semibold text-emerald-700">
                    Playbooks
                  </Link>
                </div>
                <div className="mt-3 space-y-3 text-sm">
                  <article className="rounded-2xl border border-emerald-50 bg-emerald-50/60 p-3">
                    <p className="text-xs uppercase text-emerald-700">Check-in window</p>
                    <p className="text-gray-600">
                      Arrive 45 minutes early for sound check, light tests, and guest warm-up.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-emerald-50 bg-emerald-50/60 p-3">
                    <p className="text-xs uppercase text-emerald-700">Content capture</p>
                    <p className="text-gray-600">
                      Capture a 60s recap, 6 portrait shots, and one business spotlight clip.
                    </p>
                  </article>
                  <article className="rounded-2xl border border-emerald-50 bg-emerald-50/60 p-3">
                    <p className="text-xs uppercase text-emerald-700">Post handoff</p>
                    <p className="text-gray-600">
                      Upload assets within 24 hours so creators can remix immediately.
                    </p>
                  </article>
                </div>
              </section>

              <section className="rounded-3xl border border-amber-100 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-amber-600">
                      Content library
                    </p>
                    <p className="text-sm text-gray-600">Reusable moments by activation</p>
                  </div>
                  <Link href="/feed" className="text-xs font-semibold text-amber-700">
                    Browse all
                  </Link>
                </div>
                {feedPreview.items.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
                    No new posts. Visit the feed to publish activation content.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {feedPreview.items.slice(0, 3).map((post) => (
                      <article
                        key={post.id}
                        className="rounded-2xl border border-amber-50 bg-amber-50/40 p-3 text-sm"
                      >
                        <p className="text-xs uppercase text-amber-600">
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
                            className="mt-1 inline-flex text-xs font-semibold text-amber-700"
                          >
                            View activation
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
                title="Activation tasks"
                subtitle="Match creators to on-site activations."
              />
            </aside>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
