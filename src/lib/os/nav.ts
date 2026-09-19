export type OsNavItem = {
  href: string;
  label: string;
  description: string;
  shortcut?: string;
  mobile?: boolean;
};

export const mobileNav: OsNavItem[] = [
  { href: "/", label: "Home", description: "Home", mobile: true },
  { href: "/build", label: "Build", description: "Build", mobile: true },
  { href: "/community", label: "Community", description: "Community", mobile: true },
  { href: "/projects", label: "Projects", description: "Projects", mobile: true },
  { href: "/profile", label: "Profile", description: "Profile", mobile: true },
];

export const desktopNav: OsNavItem[] = [
  { href: "/", label: "Home", description: "Home", shortcut: "G H" },
  { href: "/build", label: "Build", description: "Build", shortcut: "G B" },
  { href: "/projects", label: "Projects", description: "Projects", shortcut: "G P" },
  { href: "/studio", label: "Studio", description: "Studio", shortcut: "G S" },
  { href: "/community", label: "Community", description: "Community", shortcut: "G C" },
  { href: "/marketplace", label: "Marketplace", description: "Marketplace", shortcut: "G M" },
  { href: "/learn", label: "Learn", description: "Learn", shortcut: "G L" },
  { href: "/Blog", label: "Blogs", description: "Blogs" },
  { href: "/events", label: "Events", description: "Events", shortcut: "G E" },
  { href: "/profile", label: "Profile", description: "Profile" },
  { href: "/settings", label: "Settings", description: "Settings" },
];

export const commandRoutes: OsNavItem[] = [
  ...desktopNav,
  { href: "/shop", label: "Shop", description: "Shop" },
  { href: "/rooms", label: "Rooms", description: "Rooms" },
  { href: "/feed", label: "Feed", description: "Feed" },
  { href: "/Blog/me", label: "Mine", description: "Mine" },
  { href: "/laundry", label: "Laundry", description: "Laundry" },
  { href: "/careers", label: "Careers", description: "Careers" },
  { href: "/calendar", label: "Calendar", description: "Calendar" },
  { href: "/creators/dashboard", label: "Studio", description: "Studio" },
  { href: "/suppliers/dashboard", label: "Suppliers", description: "Suppliers" },
  { href: "/drivers/dashboard", label: "Drivers", description: "Drivers" },
  { href: "/studio/session", label: "Room", description: "Room" },
  { href: "/founder", label: "Founder", description: "Founder" },
  { href: "/admin", label: "Admin", description: "Admin" },
];

export const isNavActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};
