import Link from "next/link";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import {
  Disclosure,
  DisclosureButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";

// Heroicons used for skills
import {
  CloudArrowUpIcon,
  LockClosedIcon,
  CircleStackIcon,
} from "@heroicons/react/24/solid";

const navigation = [
  { name: "Dashboard", href: "./", current: false },
  { name: "Shop", href: "/shop", current: false },
  { name: "Rooms", href: "/rooms", current: false },
  { name: "Projects", href: "/projects", current: false },
  { name: "Team", href: "/team", current: true },
  { name: "Calendar", href: "/calendar", current: false },
  { name: "Careers", href: "/careers", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// ------------------
// Team Data
// ------------------
const teamMembers = [
  {
    name: "Doctor Kganya Kekana",
    role: "Full Stack Developer",
    bio: `A Full Stack Developer with 4+ years in web development, digital marketing, 
    and design. Skilled in JavaScript, TypeScript, React, Next.js, Prisma, UX/UI, and 
    Azure-certified with experience in scalable cloud solutions.`,
    image:
      "https://utfs.io/f/zFJP5UraSTwKTLYJoDBehcnS59R2JXpW3jGUOy7wI4kfgiZE",
    skills: [
      {
        title: "Push to Deploy",
        description:
          "Expertise in Microsoft Azure, Vercel, and GitHub with CI/CD pipelines.",
        icon: CloudArrowUpIcon,
      },
      {
        title: "Authentication & Security",
        description:
          "NextAuth with Discord provider integration to protect and secure data.",
        icon: LockClosedIcon,
      },
      {
        title: "Databases",
        description:
          "Proficient with Vercel Postgres, MongoDB, and Azure CosmosDB for custom solutions.",
        icon: CircleStackIcon,
      },
    ],
  },
  {
    name: "Jane Doe",
    role: "UI/UX Designer",
    bio: `Creative designer specializing in intuitive, user-friendly experiences 
    and scalable design systems.`,
    image: "https://utfs.io/f/placeholder-image", // replace with real
    skills: [
      {
        title: "Design Systems",
        description: "Skilled in Figma, Adobe XD, and Tailwind-based libraries.",
        icon: CloudArrowUpIcon,
      },
      {
        title: "Accessibility",
        description: "Focused on WCAG compliance, responsive layouts, and inclusive design.",
        icon: LockClosedIcon,
      },
    ],
  },
];

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

  return (
    <HydrateClient>
      <div className="min-h-full bg-gray-100">
        {/* Navbar */}
        <Disclosure as="nav" className="sticky top-0 z-50 bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
            <Link href="./">
              <img
                alt="Cloudus"
                src="https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"
                className="h-10 w-10 rounded-full"
              />
            </Link>
            <div className="hidden md:flex gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-blue-100",
                    "rounded-md px-3 py-2 text-sm font-medium"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
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
            <div className="md:hidden">
              <DisclosureButton className="rounded-md bg-gray-100 p-2 text-gray-600 hover:text-blue-600">
                <Bars3Icon className="h-6 w-6" />
              </DisclosureButton>
            </div>
          </div>
        </Disclosure>

        {/* Header */}
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-800">Meet the Team</h1>
            <p className="text-gray-500">The people behind Cloudus</p>
          </div>
        </header>

        {/* Team Section */}
        <main className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  className="bg-white rounded-xl shadow-md p-6 text-center flex flex-col items-center"
                >
                  {/* Round Avatar */}
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-32 w-32 rounded-full object-cover shadow-lg border-4 border-white -mt-16 mb-4"
                  />
                  <h3 className="text-xl font-semibold text-gray-800">{member.name}</h3>
                  <p className="text-sm text-indigo-600 font-medium">{member.role}</p>
                  <p className="mt-3 text-sm text-gray-600">{member.bio}</p>

                  {/* Skills with icons */}
                  <dl className="mt-6 space-y-4 text-sm text-left w-full">
                    {member.skills.map((skill) => (
                      <div key={skill.title} className="flex items-start gap-2">
                        <skill.icon className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                        <div>
                          <dt className="font-semibold text-gray-800">{skill.title}</dt>
                          <dd className="text-gray-600">{skill.description}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
