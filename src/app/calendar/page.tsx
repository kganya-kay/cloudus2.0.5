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
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
} from "date-fns";

import jsforce from "jsforce";

// --------------------
// Types
// --------------------
interface SalesforceEvent {
  Id: string;
  Subject: string;
  StartDateTime: string;
}

// --------------------
// Salesforce query (⚠️ refactor later into TRPC/server)
// --------------------
const conn = new jsforce.Connection();
await conn.login("kganyaomnistudio@gmail.com", "542692kK.");
const res = await conn.query<SalesforceEvent>(
  "SELECT Id, Subject, StartDateTime FROM Event"
);

// --------------------
// Safe fallback for eachDayOfInterval
// --------------------
function eachDayOfInterval(interval: { start: Date; end: Date }): Date[] {
  const dates: Date[] = [];
  const current = new Date(interval.start);
  while (current <= interval.end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

const navigation = [
  { name: "Dashboard", href: "./", current: false },
  { name: "Shop", href: "/shop", current: false },
  { name: "Projects", href: "/projects", current: false },
  { name: "Team", href: "/team", current: false },
  { name: "Calendar", href: "/calendar", current: true },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// --------------------
// Main Component
// --------------------
export default async function Home() {
  await api.post.hello({ text: "from Cloudus" });
  const session = await auth();

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

  // Calendar helpers
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
        {/* Navbar */}
        <Disclosure as="nav" className="sticky top-0 z-50 bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo + nav */}
              <div className="flex items-center">
                <Link href="./">
                  <img
                    alt="Cloudus"
                    src="https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"
                    className="h-10 w-10 rounded-full"
                  />
                </Link>
                <div className="hidden md:block ml-10">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={classNames(
                          item.current
                            ? "bg-blue-500 text-white"
                            : "text-gray-700 hover:bg-blue-100",
                          "rounded-md px-3 py-2 text-sm font-medium transition"
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profile dropdown */}
              <div className="hidden md:flex items-center gap-4">
                <button className="rounded-full bg-gray-100 p-2 text-gray-600 hover:text-blue-500">
                  <BellIcon className="h-6 w-6" />
                </button>
                <Menu as="div" className="relative">
                  <MenuButton className="flex items-center rounded-full bg-gray-100">
                    <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md">
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

              {/* Mobile menu */}
              <div className="flex md:hidden">
                <DisclosureButton className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-blue-100 hover:text-blue-600">
                  <Bars3Icon className="h-6 w-6" />
                </DisclosureButton>
              </div>
            </div>
          </div>
        </Disclosure>

        {/* Header */}
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-800">Calendar & Events</h1>
            <p className="text-gray-500">
              Track meetings, standups, and Salesforce deadlines
            </p>
          </div>
        </header>

        {/* Main */}
        <main className="min-h-screen bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar grid */}
            <div className="bg-white rounded-xl shadow-md p-4 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                {format(today, "MMMM yyyy")}
              </h2>
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-600">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {days.map((day: Date) => {
                  const dayEvents = events.filter((e) =>
                    isSameDay(new Date(e.StartDateTime), day)
                  );
                  return (
                    <div
                      key={day.toISOString()}
                      className={classNames(
                        "h-20 rounded-md border flex flex-col items-center justify-start p-1 text-xs",
                        isSameMonth(day, today)
                          ? "bg-gray-50 text-gray-800"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      <span className="font-semibold">{format(day, "d")}</span>
                      {dayEvents.map((ev) => (
                        <span
                          key={ev.Id}
                          className="mt-1 w-full truncate rounded bg-blue-100 text-blue-700 px-1"
                        >
                          {ev.Subject}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Upcoming Timeline
              </h2>
              <ul role="list" className="space-y-4">
                {events
                  .sort(
                    (a, b) =>
                      new Date(a.StartDateTime).getTime() -
                      new Date(b.StartDateTime).getTime()
                  )
                  .map((record) => (
                    <li key={record.Id} className="flex items-start">
                      <div className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-blue-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-800">
                          {record.Subject}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(record.StartDateTime), "EEE, MMM d • h:mm a")}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
