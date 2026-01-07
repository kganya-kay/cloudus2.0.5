import { Metadata } from "next";
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

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { HydrateClient } from "~/trpc/server";
import { LaundryOrderClient } from "./laundry-order-client";

export const metadata: Metadata = {
  title: "Laundry Service | Cloudus",
  description:
    "Book laundry pickups with Cloudus. Share your pickup location, pay securely, and track progress in one place.",
};

export default async function LaundryPage() {
  const session = await auth();
  const user = {
    name: session?.user?.name ?? "Guest",
    image:
      session?.user?.image ??
      "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf",
    email: session?.user?.email ?? "",
  };

  const navigation = [
    { name: "Laundry", href: "/laundry", current: true },
    { name: "Rentals", href: "/rooms", current: false },
    { name: "Shop", href: "/shop", current: false },
    { name: "Web apps", href: undefined, current: false },
    { name: "Integrations", href: undefined, current: false },
    { name: "Reports & dashboards", href: undefined, current: false },
  ];
  const userNavigation = [
    { name: "Profile", href: "/profile" },
    { name: session ? "Sign out" : "Sign in", href: session ? "/api/auth/signout" : "/api/auth/signin" },
  ];

  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    orderBy: [{ createdAt: "desc" }],
    take: 12,
    select: {
      id: true,
      name: true,
      city: true,
      suburb: true,
      pricePerKg: true,
    },
  });

  const classNames = (...classes: string[]) => classes.filter(Boolean).join(" ");

  return (
    <HydrateClient>
      <div className="min-h-full bg-gray-100">
        <Disclosure as="nav" className="sticky top-0 z-40 bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link href="/">
                  <img
                    alt="Cloudus"
                    src="https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"
                    className="h-10 w-10 rounded-full"
                  />
                </Link>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Top services
                    </span>
                    {navigation.map((item) => (
                      item.href ? (
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
                      ) : (
                        <span
                          key={item.name}
                          className="rounded-md px-3 py-2 text-sm font-medium text-gray-500"
                        >
                          {item.name}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden items-center gap-4 md:flex">
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
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                        >
                          {item.name}
                        </a>
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Menu>
              </div>

              <div className="flex md:hidden">
                <DisclosureButton className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <Bars3Icon className="h-6 w-6" />
                </DisclosureButton>
              </div>
            </div>
          </div>

          <DisclosurePanel className="bg-white shadow md:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
              {navigation.map((item) => (
                item.href ? (
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
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </DisclosureButton>
                ) : (
                  <span
                    key={item.name}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-500"
                  >
                    {item.name}
                  </span>
                )
              ))}
            </div>
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="flex items-center">
                <img className="h-10 w-10 rounded-full" src={user.image} alt="" />
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {userNavigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-100"
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
            </div>
          </DisclosurePanel>
        </Disclosure>

        <main className="mx-auto max-w-5xl space-y-10 px-6 py-8">
        <section className="rounded-3xl border bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-blue-700">Laundry</p>
          <h1 className="text-3xl font-semibold text-gray-900">Pickup, wash, deliver.</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-700">
            Keep it simple: share your pickup details, choose the service, and pay securely. We confirm the supplier and
            drivers handle the rest.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">What's included</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>Wash, dry, fold, and optional pressing.</li>
              <li>Drivers collect and drop off at your preferred time.</li>
              <li>Updates for pickup, payment, and delivery milestones.</li>
            </ul>
            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
              Weight entered here is an estimate. We confirm the final weight at the supplier and adjust billing if
              required.
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
              <li>Submit your pickup details.</li>
              <li>Pay securely to confirm.</li>
              <li>Track supplier assignment, pickup, and delivery.</li>
            </ol>
            <p className="mt-3 text-xs text-gray-500">
              Typical turnaround is 24-48 hours depending on service and weight.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Place a laundry order</h2>
          <p className="text-sm text-gray-600">
            We assign a supplier, confirm the final weight, and keep you updated throughout.
          </p>
          <div className="mt-6">
            <LaundryOrderClient defaultName={session?.user?.name} defaultEmail={session?.user?.email} />
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Suppliers</p>
              <h3 className="text-lg font-semibold text-gray-900">Laundry partners near you</h3>
            </div>
            <span className="text-xs font-semibold text-gray-500">{suppliers.length} partners</span>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {suppliers.length === 0 ? (
              <p className="text-sm text-gray-500">No suppliers listed yet.</p>
            ) : (
              suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="min-w-[180px] rounded-2xl border border-gray-100 bg-gray-50/60 p-3 text-sm text-gray-800 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-center text-base font-semibold uppercase text-white shadow-sm">
                      <span className="flex h-full items-center justify-center">
                        {(supplier.name ?? "Supplier").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-500">
                        {[supplier.suburb, supplier.city].filter(Boolean).join(", ") || "Location pending"}
                      </p>
                    </div>
                  </div>
                  {supplier.pricePerKg ? (
                    <p className="mt-2 text-xs text-gray-600">
                      From {(supplier.pricePerKg / 100).toFixed(2)} per kg
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-600">Pricing on request</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      </div>
    </HydrateClient>
  );
}
