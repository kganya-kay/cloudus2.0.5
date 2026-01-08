"use client";

import Link from "next/link";
import { useMemo } from "react";
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
import { AssistantSearchBar } from "./AssistantSearchBar";
import { api } from "~/trpc/react";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Feed", href: "/feed" },
  { name: "Projects", href: "/projects" },
  { name: "Shop", href: "/shop" },
  { name: "Rentals", href: "/rooms" },
  { name: "Suppliers", href: "/suppliers/dashboard" },
  { name: "Drivers", href: "/drivers/dashboard" },
  { name: "Creators", href: "/creators/dashboard" },
  { name: "Team", href: "/team" },
  { name: "Calendar", href: "/calendar" },
  { name: "Careers", href: "/careers" },
];

type DashboardTopNavProps = {
  user: { name: string; image: string; email: string };
  session: boolean;
};

export default function DashboardTopNav({ user, session }: DashboardTopNavProps) {
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
    <Disclosure
      as="nav"
      className="sticky top-0 z-50 border-b border-blue-100 bg-gradient-to-r from-white/90 via-blue-50/60 to-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70"
    >
      <div className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-3">
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

          <div className="mx-auto w-full max-w-3xl flex-1">
            <AssistantSearchBar />
          </div>

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
                                markRead.mutate({ id: notification.id });
                                close();
                              }}
                              className={`w-full px-4 py-3 text-left text-sm transition hover:bg-blue-50 ${notification.readAt ? "bg-white" : "bg-emerald-50"}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-gray-900">
                                  {notification.title}
                                </p>
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
  );
}
