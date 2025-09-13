"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
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
import { jobs } from "../lib/jobs";

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}


export default function CareersPage() {
    const { data: session } = useSession();

    const user = {
        name: session?.user?.name ?? "Guest",
        image:
            session?.user?.image ??
            "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV",
        email: session?.user?.email ?? "",
    };

    const navigation = [
        { name: "Dashboard", href: "/", current: false },
        { name: "Shop", href: "/shop", current: false },
        { name: "Projects", href: "/projects", current: false },
        { name: "Team", href: "/team", current: false },
        { name: "Calendar", href: "/calendar", current: false },
        { name: "Careers", href: "/careers", current: true },
    ];

    const userNavigation = [
        { name: "Your Profile", href: "/profile" },
        { name: "Settings", href: "/settings" },
        {
            name: session?.user ? "Sign out" : "Sign in",
            href: session?.user ? "/api/auth/signout" : "/api/auth/signin",
        },
    ];

    return (
        <div className="min-h-full bg-gray-100">
            {/* Navbar */}
            <Disclosure as="nav" className="sticky top-0 z-50 bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo & Nav */}
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
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            aria-current={item.current ? "page" : undefined}
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
                                import Link from "next/link";

                                // ...
                                <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                                    {userNavigation.map((item) => (
                                        <MenuItem key={item.name}>
                                            {({ active }) => (
                                                <Link
                                                    href={item.href}
                                                    className={`block px-4 py-2 text-sm ${active ? "bg-blue-50 text-gray-800" : "text-gray-700"
                                                        }`}
                                                >
                                                    {item.name}
                                                </Link>
                                            )}
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
                                as={Link}
                                href={item.href}
                                className={`block rounded-md px-3 py-2 text-base font-medium ${item.current ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-blue-100"
                                    }`}
                            >
                                {item.name}
                            </DisclosureButton>
                        ))}
                    </div>
                    {/* ... */}
                    <div className="mt-3 space-y-1 px-2">
                        {userNavigation.map((item) => (
                            <DisclosureButton
                                key={item.name}
                                as={Link}
                                href={item.href}
                                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-blue-50"
                            >
                                {item.name}
                            </DisclosureButton>
                        ))}
                    </div>
                </DisclosurePanel>

            </Disclosure>

            {/* Page header */}
            <header className="bg-white shadow">
                <div className="mx-auto flex max-w-7xl justify-between items-center px-4 py-6 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-gray-800">Careers</h1>
                    <Link
                        href={session?.user ? "/careers/create" : "/api/auth/signin"}
                        className="rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        {session?.user ? "Post a Job" : "Sign in"}
                    </Link>
                </div>
            </header>

            {/* Main content */}
            <main className="min-h-screen bg-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        {/* Search + filters */}
                        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex w-full items-center gap-2 md:w-1/2">
                                <input
                                    type="text"
                                    placeholder="Search roles…"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                                <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                                    Clear
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                                    <option value="">All types</option>
                                    <option>Full‑time</option>
                                    <option>Part‑time</option>
                                    <option>Contract</option>
                                </select>
                                <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                                    <option value="">All locations</option>
                                    <option>Johannesburg</option>
                                    <option>Remote</option>
                                </select>
                            </div>
                        </div>

                        {/* Jobs grid */}
                        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {jobs.map((job) => (
                                <li key={job.id} className="group rounded-xl border border-gray-200 p-5 shadow-sm transition hover:shadow">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">
                                            <Link href={`/careers/${job.slug}`}>{job.title}</Link>
                                        </h3>
                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                            {job.type}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">{job.location}</p>
                                    <p className="mt-3 text-sm text-gray-700">{job.summary}</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {job.tags.map((t) => (
                                            <span key={t} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-5 flex items-center justify-between">
                                        <Link
                                            href={`/careers/${job.slug}`}
                                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        >
                                            View & Apply
                                        </Link>
                                        <a
                                            href={`mailto:careers@cloudusdigital.com?subject=${encodeURIComponent(
                                                `Application: ${job.title}`
                                            )}`}
                                            className="text-sm text-blue-700 hover:underline"
                                        >
                                            Email CV
                                        </a>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Empty state (when there are no jobs) */}
                        {jobs.length === 0 && (
                            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
                                <h4 className="text-lg font-semibold text-gray-800">No open roles right now</h4>
                                <p className="mt-1 text-sm text-gray-600">
                                    Follow us and check back soon — we post new opportunities regularly.
                                </p>
                                <div className="mt-4">
                                    <a
                                        href="/api/auth/signin"
                                        className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                    >
                                        Sign in to post a job
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
