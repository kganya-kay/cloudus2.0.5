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
  { name: "Shop", href: "/shop", current: false },
  { name: "Projects", href: "/projects", current: true },
  { name: "Team", href: "/team", current: false },
  { name: "Calendar", href: "/calendar", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

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
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
