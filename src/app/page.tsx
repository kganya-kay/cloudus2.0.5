import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { LatestProject } from "./_components/project";
import AllProjects from "./_components/allProjects";
import OpenProjectsCard from "./_components/openProjectsCard";
import ShopCard from "./_components/shopCard";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import Button from "@mui/material/Button";
import NewLead from "./_components/newLead";
import GetWebApplication from "./_components/getWebApplication";
import TechDest from "./_components/techDest"; // Adjust the path as needed

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
import AllPublicProjects from "./_components/allPublicProjects";
import Special from "./_components/specials";
import Video from "./_components/video";
import NewProductFlow from "./_components/newProductFlow";

const navigation = [
  { name: "Dashboard", href: "./", current: true },
  { name: "Shop", href: "/shop", current: false },
  { name: "Projects", href: "/projects", current: false },
  { name: "Team", href: "/team", current: false },
  { name: "Calendar", href: "/calendar", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default async function Home() {
  const hello = await api.post.hello({ text: "from Cloudus" });
  const session = await auth();
  const user = {
    name: session?.user.name,
    image: "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV",
    email: session?.user.email,
  };

  const userNavigation = [
    { name: "Your Profile", href: "#" },
    { name: "Settings", href: "#" },
    { name: "Admin", href: "/admin" },
    {
      name: session ? "Sign out" : "Sign In",
      href: session ? "/api/auth/signout" : "/api/auth/signin",
    },
  ];

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }
  if (session?.user.image !== undefined && session?.user.image !== null) {
    user.image = session?.user.image;
  }

  return (
    <HydrateClient>
      <>
        <div className="min-h-full">
          <Disclosure as="nav" className="sticky top-0 z-50 bg-gray-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="shrink-0">
                    <img
                      alt="Your Company"
                      src="https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"
                      className="size-12 rounded-full"
                    />
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-4">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          aria-current={item.current ? "page" : undefined}
                          className={classNames(
                            item.current
                              ? "bg-gray-900 text-white"
                              : "text-gray-500 hover:bg-gray-700 hover:text-white",
                            "rounded-md px-3 py-2 text-sm font-medium",
                          )}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    <button
                      type="button"
                      className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                      <span className="absolute -inset-1.5" />
                      <span className="sr-only">View notifications</span>
                      <BellIcon aria-hidden="true" className="size-6" />
                    </button>

                    {/* Profile dropdown */}
                    <Menu as="div" className="relative ml-3">
                      <div>
                        <MenuButton className="relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                          <span className="absolute -inset-1.5" />
                          <span className="sr-only">Open user menu</span>
                          <img
                            alt=""
                            src={user.image}
                            className="size-8 rounded-full"
                          />
                        </MenuButton>
                      </div>
                      <MenuItems
                        transition
                        className="absolute right-0 z-10 mt-32 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                      >
                        {userNavigation.map((item) => (
                          <MenuItem key={item.name}>
                            <a
                              href={item.href}
                              className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                            >
                              {item.name}
                            </a>
                          </MenuItem>
                        ))}
                      </MenuItems>
                    </Menu>
                  </div>
                </div>
                <div className="-mr-2 flex md:hidden">
                  {/* Mobile menu button */}
                  <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    <Bars3Icon
                      aria-hidden="true"
                      className="block size-6 group-data-[open]:hidden"
                    />
                    <XMarkIcon
                      aria-hidden="true"
                      className="hidden size-6 group-data-[open]:block"
                    />
                  </DisclosureButton>
                </div>
              </div>
            </div>

            <DisclosurePanel className="md:hidden">
              <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                {navigation.map((item) => (
                  <DisclosureButton
                    key={item.name}
                    as="a"
                    href={item.href}
                    aria-current={item.current ? "page" : undefined}
                    className={classNames(
                      item.current
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-700 hover:text-white",
                      "block rounded-md px-3 py-2 text-base font-medium",
                    )}
                  >
                    {item.name}
                  </DisclosureButton>
                ))}
              </div>
              <div className="border-t border-gray-700 pb-3 pt-4">
                <div className="flex items-center px-5">
                  <div className="shrink-0">
                    <img
                      alt=""
                      src={user.image}
                      className="size-10 rounded-full"
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base/5 font-medium text-white">
                      {user.name}
                    </div>
                    <div className="text-sm font-medium text-gray-400">
                      {user.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="relative ml-auto shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View notifications</span>
                    <BellIcon aria-hidden="true" className="size-6" />
                  </button>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  {userNavigation.map((item) => (
                    <DisclosureButton
                      key={item.name}
                      as="a"
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white"
                    >
                      {item.name}
                    </DisclosureButton>
                  ))}
                </div>
              </div>
            </DisclosurePanel>
            <header className="sticky top-16 bg-white shadow">
              <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-700">
                  Dashboard
                </h1>
                <p className="text-2xl text-gray-400">Welcome {user.name}</p>
              </div>
            </header>
          </Disclosure>

          <main className="flex min-h-screen flex-col justify-center bg-gray-200 text-white">
            <div className="flex-col justify-around">
              <br />

              <div className="max-w-screen-lg justify-self-center">
                <GetWebApplication />
              </div>

              
              <br />
              <div className="max-w-screen-lg justify-self-center p-4 bg-gray-100 rounded-lg shadow-md text-gray-900">
                <TechDest />
              </div>
              <br />
              <div className="max-w-screen-lg justify-self-center">
                <NewProductFlow />
              </div>

              <br />
              <Special />
              <br />

              <div className="max-w-screen-lg justify-self-center">
                {<AllPublicProjects />}
              </div>
              <br />

              <div>
                <NewLead />
              </div>
              <br />
              <div id="video" className="flex justify-center">
                <Video />
              </div>
              <br />
              <div className="border-1 flex justify-center justify-self-center rounded-full border-white bg-green-300">
                {session ? (
                  <Button
                    style={{
                      minWidth: "50px",
                      minHeight: "30px",
                      position: "inherit",
                    }}
                    className="justify-between justify-self-center py-2 align-top"
                    href="./projects/create"
                  >
                    +
                  </Button>
                ) : (
                  <Button
                    size="medium"
                    className="min-w-full justify-between justify-self-center"
                    href="/api/auth/signin"
                  >
                    login
                  </Button>
                )}
              </div>

              <br />
            </div>
          </main>
        </div>
      </>
    </HydrateClient>
  );
}
