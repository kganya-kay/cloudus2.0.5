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

import { MarketplaceTasksPanel } from "../_components/MarketplaceTasksPanel";
import { auth } from "~/server/auth";
import { HydrateClient, api } from "~/trpc/server";

const navigation = [
  { name: "Dashboard", href: "./", current: false },
  { name: "Feed", href: "/feed", current: false },
  { name: "Projects", href: "/projects", current: true },
  { name: "Shop", href: "/shop", current: false },
  { name: "Suppliers", href: "/suppliers/dashboard", current: false },
  { name: "Drivers", href: "/drivers/dashboard", current: false },
  { name: "Creators", href: "/creators/dashboard", current: false },
  { name: "Calendar", href: "/calendar", current: false },
  { name: "Careers", href: "/careers", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const formatCurrency = (value?: number | null) => {
  if (!value || Number.isNaN(value)) return "R 0";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(Math.round(value / 100));
  } catch {
    return `R ${((value ?? 0) / 100).toFixed(0)}`;
  }
};

export default async function ProjectsPage() {
  await api.post.hello({ text: "from Cloudus" });
  const session = await auth();
  const [marketplace, announcements] = await Promise.all([
    api.project.marketplace({ limit: 24 }),
    api.platform.announcements({ limit: 3 }),
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

  const projects = marketplace ?? [];

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
                  <div className="text-base font-medium text-gray-700">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
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

        <section className="relative isolate overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-600 to-sky-500 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle,_rgba(255,255,255,0.35),_transparent_70%)]" />
          </div>
          <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Cloudus marketplace</p>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                Claim world-class briefs, contribute to launches, and earn like a top creator.
              </h1>
              <p className="text-sm text-white/80">
                Browse public projects from Cloudus customers, see open tasks, and apply with one click.
                Creators, suppliers, and drivers can collaborate on the same platform.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/projects/create"
                  className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30"
                >
                  Launch your project
                </Link>
                <Link
                  href="/creators/dashboard"
                  className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  Creator dashboard
                </Link>
                <Link
                  href="/feed"
                  className="rounded-full bg-indigo-900/50 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-900/70"
                >
                  View feed
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">Live stats</p>
              <dl className="mt-4 space-y-2 text-sm text-white/80">
                <div className="flex items-center justify-between">
                  <dt>Public projects</dt>
                  <dd className="text-lg font-semibold text-white">{projects.length}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Average open tasks</dt>
                  <dd className="text-lg font-semibold text-white">
                    {projects.length === 0
                      ? 0
                      : Math.round(
                          projects.reduce((sum, project) => sum + (project.openTaskCount ?? 0), 0) /
                            projects.length,
                        )}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Creators active this week</dt>
                  <dd className="text-lg font-semibold text-white">
                    {Math.max(
                      4,
                      Math.min(
                        999,
                        projects.reduce(
                          (sum, project) => sum + (project._count?.contributors ?? 0),
                          0,
                        ),
                      ),
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <main className="bg-gray-100 pb-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:px-8">
            <section className="space-y-6">
              {projects.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-white/80 p-8 text-center shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900">No marketplace projects yet</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Launch yours from{" "}
                    <Link href="/projects/create" className="text-blue-600 underline">
                      /projects/create
                    </Link>{" "}
                    or check back after the next drop.
                  </p>
                </div>
              ) : (
                                projects.map((project) => {
                  const openTasks = (project.tasks ?? []).slice(0, 3);
                  const shareLinks = (project.links ?? []).slice(0, 2);
                  const followerCount = project._count?.followers ?? 0;
                  const contributorCount = project._count?.contributors ?? 0;
                  const openTaskCount = project.openTaskCount ?? openTasks.length;
                  const availableBudgetLabel = formatCurrency(project.availableBudgetCents ?? 0);
                  const budgetUsedPercent =
                    project.price > 0 && project.availableBudgetCents !== undefined
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            Math.round(
                              ((project.price - project.availableBudgetCents) / project.price) * 100,
                            ),
                          ),
                        )
                      : 0;
                  return (
                    <article
                      key={project.id}
                      className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 p-5 text-white">
                        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -bottom-14 -right-16 h-40 w-40 rounded-full bg-blue-300/10 blur-3xl" />
                        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
                            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white/10 ring-2 ring-white/20">
                              <img src={project.image} alt={project.name} className="h-full w-full object-cover" />
                              <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase text-gray-800">
                                {project.type}
                              </span>
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-white/70">
                                <span className="rounded-full bg-white/15 px-2 py-1 font-semibold">
                                  {project.status}
                                </span>
                                <span className="rounded-full bg-white/10 px-2 py-1 font-semibold">
                                  {project.tags?.slice(0, 2).join(' ? ') || 'Marketplace'}
                                </span>
                              </div>
                              <h3 className="mt-1 text-xl font-semibold text-white">{project.name}</h3>
                              <p className="text-sm text-white/80 line-clamp-2">{project.description}</p>
                            </div>
                          </div>
                          <div className="w-full max-w-sm space-y-2 rounded-2xl bg-white/10 p-3 text-xs text-white/80 backdrop-blur">
                            <div className="flex items-center justify-between">
                              <span>Open tasks</span>
                              <span className="font-semibold text-white">{openTaskCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Community</span>
                              <span className="font-semibold text-white">
                                {followerCount} followers ? {contributorCount} contributors
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Available budget</span>
                              <span className="font-semibold text-white">{availableBudgetLabel}</span>
                            </div>
                            {project.price ? (
                              <div>
                                <div className="flex items-center justify-between">
                                  <span>Usage</span>
                                  <span className="font-semibold text-white">{budgetUsedPercent}%</span>
                                </div>
                                <div className="mt-1 h-2 rounded-full bg-white/15">
                                  <div
                                    className="h-2 rounded-full bg-emerald-300"
                                    style={{ width: `${budgetUsedPercent}%` }}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {openTasks.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-gray-500">Top open tasks</p>
                            <div className="flex flex-wrap gap-2">
                              {openTasks.map((task) => (
                                <span
                                  key={task.id}
                                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                                >
                                  {task.title} • {formatCurrency(task.budgetCents)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {shareLinks.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase text-gray-500">Shareable links</p>
                            <div className="flex flex-wrap gap-2">
                              {shareLinks.map((link) => {
                                const isAbsolute = /^https?:\/\//i.test(link);
                                const isRelative = !isAbsolute && link.startsWith('/');
                                const href = isAbsolute || isRelative ? link : undefined;
                                let label = link.slice(0, 32) || 'Link';
                                if (href && isAbsolute) {
                                  try {
                                    label = new URL(link).hostname.replace('www.', '');
                                  } catch {
                                    label = link;
                                  }
                                }
                                const className =
                                  'inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700';
                                return href ? (
                                  <a
                                    key={`${project.id}-${link}`}
                                    href={href}
                                    target={isAbsolute ? "_blank" : undefined}
                                    rel={isAbsolute ? "noreferrer" : undefined}
                                    className={className}
                                  >
                                    {label}
                                  </a>
                                ) : (
                                  <span key={`${project.id}-${link}`} className={className}>
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`/projects/${project.id}`}
                            className="inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            View project
                          </Link>
                          <Link
                            href={`/projects/${project.id}#tasks`}
                            className="inline-flex rounded-full border border-blue-600 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                          >
                            Claim / apply
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-blue-100 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-600">
                      Marketplace alerts
                    </p>
                    <p className="text-sm text-gray-600">Announcements from Cloudus HQ</p>
                  </div>
                  <Link href="/admin" className="text-xs font-semibold text-blue-700">
                    Admin
                  </Link>
                </div>
                {announcements.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No announcements right now.</p>
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

              <section className="rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Need help?</p>
                <ul className="mt-3 space-y-3 text-sm text-gray-700">
                  <li className="rounded-2xl border border-gray-100 px-4 py-3">
                    <p className="font-semibold text-gray-900">Guide: How to bid</p>
                    <p className="text-xs text-gray-500">
                      Share your handle, pick tasks, and confirm payout terms.
                    </p>
                  </li>
                  <li className="rounded-2xl border border-gray-100 px-4 py-3">
                    <p className="font-semibold text-gray-900">Share marketplace</p>
                    <p className="text-xs text-gray-500">
                      Send creators to cloudusdigital.com/projects for new briefs.
                    </p>
                  </li>
                </ul>
              </section>

              <MarketplaceTasksPanel
                role="CREATOR"
                limit={6}
                title="Tasks to claim"
                subtitle="Jump into active briefs without waiting on invites."
              />
            </aside>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
