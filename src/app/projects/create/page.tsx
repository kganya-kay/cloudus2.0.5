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
import Button from "@mui/material/Button";
import { LatestProject } from "~/app/_components/project";

const navigation = [
  { name: "Dashboard", href: "../", current: false },
  { name: "Feed", href: "/feed", current: false },
  { name: "Projects", href: "/projects", current: true },
  { name: "Shop", href: "/shop", current: false },
  { name: "Rentals", href: "/rooms", current: false },
  { name: "Suppliers", href: "/suppliers/dashboard", current: false },
  { name: "Drivers", href: "/drivers/dashboard", current: false },
  { name: "Creators", href: "/creators/dashboard", current: false },
  { name: "Team", href: "/team", current: false },
  { name: "Calendar", href: "/calendar", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const formatBudget = (value?: number | null) => {
  if (!value || Number.isNaN(value)) return "R 0";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(value / 100);
  } catch {
    return `R ${(value / 100).toFixed(0)}`;
  }
};

export default async function Home() {
  await api.post.hello({ text: "from Cloudus" });
  const session = await auth();
  const latestProject = session?.user ? await api.project.getLatest() : null;

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
                <Link href="../">
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
          </DisclosurePanel>
        </Disclosure>

        {/* Page header */}
        <header className="bg-white shadow">
          <div className="mx-auto flex max-w-7xl justify-between items-center px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-800">Create a Project</h1>
            <Button
              variant="contained"
              href="../projects"
              className="rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              Back to Projects
            </Button>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-screen bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
            {session?.user ? (
              <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                <div className="rounded-3xl border border-emerald-200 bg-white/80 p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-emerald-600">
                    Funding workspace
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                    {latestProject
                      ? `Deposit ${formatBudget(latestProject.price)} to activate ${
                          latestProject.name
                        }`
                      : "Lock your budget and unlock project payments"}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Every project gets its own payment portal for deposits, task payouts, and audit
                    trails. Use it to keep finance, suppliers, and drivers aligned with your brief.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      component={Link}
                      href={
                        latestProject ? `/projects/${latestProject.id}/payment` : "/projects/create"
                      }
                      variant="contained"
                      className="!rounded-full !bg-blue-600"
                    >
                      {latestProject ? "Open payment portal" : "Launch configurator"}
                    </Button>
                    {latestProject && (
                      <Button
                        component={Link}
                        href={`/projects/${latestProject.id}`}
                        variant="outlined"
                        className="!rounded-full"
                      >
                        Review project brief
                      </Button>
                    )}
                    <Button
                      component={Link}
                      href="/laundry"
                      variant="text"
                      className="!rounded-full !text-blue-700"
                    >
                      Laundry ops flow
                    </Button>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                    <li>
                      <span className="font-semibold text-gray-900">Suppliers:</span>{" "}
                      <Link href="/suppliers/dashboard" className="text-blue-600 underline">
                        manage payouts
                      </Link>
                    </li>
                    <li>
                      <span className="font-semibold text-gray-900">Drivers:</span>{" "}
                      <Link href="/drivers/dashboard" className="text-blue-600 underline">
                        live GPS + deliveries
                      </Link>
                    </li>
                    <li>
                      <span className="font-semibold text-gray-900">Calendar:</span>{" "}
                      <Link href="/calendar" className="text-blue-600 underline">
                        milestone planning
                      </Link>
                    </li>
                    <li>
                      <span className="font-semibold text-gray-900">Shop:</span>{" "}
                      <Link href="/shop" className="text-blue-600 underline">
                        packaged services
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-6 text-sm text-gray-700">
                  <p className="text-xs font-semibold uppercase text-blue-600">
                    Ops shortcuts
                  </p>
                  <p className="mt-2">
                    Keep stakeholders in one workflow. Capture leads, trigger notifications, and route
                    orders without leaving Cloudus.
                  </p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5">
                    <li>
                      Use the <Link href="/" className="text-blue-600 underline">landing page</Link>{" "}
                      to collect product interest or launch /laundry flows.
                    </li>
                    <li>
                      Convert demand into <Link href="/projects" className="text-blue-600 underline">projects</Link>{" "}
                      and <Link href="/shop" className="text-blue-600 underline">shop orders</Link> for settlement.
                    </li>
                    <li>
                      Assign caretakers, suppliers, and drivers while the payment portal tracks every
                      deposit.
                    </li>
                  </ol>
                  <p className="mt-4 text-xs text-gray-500">
                    Need help wiring Salesforce leads or WhatsApp notifications? Email{" "}
                    <Link href="mailto:info@cloudusdigital.com" className="font-semibold text-blue-700 underline">
                      info@cloudusdigital.com
                    </Link>
                    .
                  </p>
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Sign in to launch a Cloudus project
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We’ll guide you through the launch configurator, spin up a payment workspace, and
                  link you to suppliers, drivers, and /shop services.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Button
                    href="/api/auth/signin"
                    variant="contained"
                    className="rounded-full bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Sign In
                  </Button>
                  <Button component={Link} href="/laundry" variant="outlined" className="rounded-full">
                    Explore laundry service
                  </Button>
                  <Button component={Link} href="/shop" variant="text" className="rounded-full">
                    Browse /shop
                  </Button>
                </div>
              </section>
            )}
            <div className="bg-white rounded-xl shadow-md p-6">
              {session?.user ? (
                <LatestProject />
              ) : (
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Sign in to create a project
                  </h2>
                  <Button
                    href="/api/auth/signin"
                    variant="contained"
                    className="rounded-full bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
