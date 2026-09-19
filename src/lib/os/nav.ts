export type OsNavItem = {
  href: string;
  label: string;
  description: string;
  shortcut?: string;
  mobile?: boolean;
};

export const mobileNav: OsNavItem[] = [
  { href: "/", label: "Home", description: "Continue building", mobile: true },
  { href: "/build", label: "Build", description: "Notes, tasks, ideas", mobile: true },
  { href: "/community", label: "Community", description: "Creators and feed", mobile: true },
  { href: "/projects", label: "Projects", description: "Software and client work", mobile: true },
  { href: "/profile", label: "Profile", description: "Your Cloudus identity", mobile: true },
];

export const desktopNav: OsNavItem[] = [
  { href: "/", label: "Home", description: "Your operating home", shortcut: "G H" },
  { href: "/build", label: "Build", description: "Capture and ship work", shortcut: "G B" },
  { href: "/projects", label: "Projects", description: "Briefs, bids, and tasks", shortcut: "G P" },
  { href: "/studio", label: "Studio", description: "Music, design, sessions", shortcut: "G S" },
  { href: "/community", label: "Community", description: "Builders and Build Nights", shortcut: "G C" },
  { href: "/marketplace", label: "Marketplace", description: "Services, beats, tools", shortcut: "G M" },
  { href: "/learn", label: "Learn", description: "Notes and playbooks", shortcut: "G L" },
  { href: "/events", label: "Events", description: "Workshops and sessions", shortcut: "G E" },
  { href: "/profile", label: "Profile", description: "Portfolio and availability" },
  { href: "/settings", label: "Settings", description: "Theme, ops, and account" },
];

export const commandRoutes: OsNavItem[] = [
  ...desktopNav,
  { href: "/shop", label: "Shop", description: "Packaged Cloudus services" },
  { href: "/rooms", label: "Rentals", description: "Rooms and bookings" },
  { href: "/feed", label: "Feed", description: "Public creator activity" },
  { href: "/laundry", label: "Laundry", description: "Pickup and delivery orders" },
  { href: "/careers", label: "Careers", description: "Join the Cloudus team" },
  { href: "/calendar", label: "Calendar", description: "Milestones and bookings" },
  { href: "/creators/dashboard", label: "Creator hub", description: "Creator operations" },
  { href: "/suppliers/dashboard", label: "Supplier portal", description: "Catalog and payouts" },
  { href: "/drivers/dashboard", label: "Driver portal", description: "Deliveries and GPS" },
  { href: "/studio/session", label: "Start Build Night", description: "Timer, checklist, recap" },
  { href: "/founder", label: "Founder console", description: "Revenue and community" },
  { href: "/admin", label: "Admin", description: "Operations console" },
];

export const isNavActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/" || pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};
