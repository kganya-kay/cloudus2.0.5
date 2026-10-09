export const SERVICE_PREFIX = "cloudus:";

export type ServiceSlug =
  | "build"
  | "studio"
  | "blog"
  | "shop"
  | "rooms"
  | "events"
  | "laundry"
  | "daily"
  | "market";

export type CloudusService = {
  slug: ServiceSlug;
  name: string;
  priceCents: number;
  href: string;
  type: string;
  tasks: string[];
};

export const CLOUDUS_SERVICES: CloudusService[] = [
  {
    slug: "build",
    name: "Build",
    priceCents: 750_000,
    href: "/build",
    type: "SERVICE",
    tasks: ["Brief", "Ship", "Handover"],
  },
  {
    slug: "studio",
    name: "Studio",
    priceCents: 850_000,
    href: "/studio",
    type: "SERVICE",
    tasks: ["Session", "Cut", "Publish"],
  },
  {
    slug: "blog",
    name: "Blog",
    priceCents: 450_000,
    href: "/Blog",
    type: "SERVICE",
    tasks: ["Voice", "Chapters", "Shelf"],
  },
  {
    slug: "shop",
    name: "Shop",
    priceCents: 950_000,
    href: "/shop",
    type: "SERVICE",
    tasks: ["Catalog", "Pay", "Fulfil"],
  },
  {
    slug: "rooms",
    name: "Rooms",
    priceCents: 650_000,
    href: "/rooms",
    type: "SERVICE",
    tasks: ["List", "Book", "Host"],
  },
  {
    slug: "events",
    name: "Events",
    priceCents: 1_200_000,
    href: "/events",
    type: "SERVICE",
    tasks: ["Date", "Room", "Night"],
  },
  {
    slug: "laundry",
    name: "Laundry",
    priceCents: 280_000,
    href: "/laundry",
    type: "SERVICE",
    tasks: ["Collect", "Clean", "Return"],
  },
  {
    slug: "daily",
    name: "Daily",
    priceCents: 1_500_000,
    href: "/",
    type: "SERVICE",
    tasks: ["Desk", "Wire", "Air"],
  },
  {
    slug: "market",
    name: "Market",
    priceCents: 1_800_000,
    href: "/marketplace",
    type: "SERVICE",
    tasks: ["Offer", "Sell", "Deliver"],
  },
];

export function serviceKey(slug: ServiceSlug) {
  return `${SERVICE_PREFIX}${slug}`;
}

export function parseServiceKey(value?: string | null) {
  if (!value?.startsWith(SERVICE_PREFIX)) return null;
  const slug = value.slice(SERVICE_PREFIX.length) as ServiceSlug;
  return CLOUDUS_SERVICES.find((item) => item.slug === slug) ?? null;
}

export function getService(slug: string) {
  return CLOUDUS_SERVICES.find((item) => item.slug === slug) ?? null;
}

export function orderProjectKey(orderId: number) {
  return `cloudus-order:${orderId}`;
}

export function serviceOfTheDay(at = new Date()) {
  const index = at.getUTCDay() % CLOUDUS_SERVICES.length;
  return CLOUDUS_SERVICES[index] ?? CLOUDUS_SERVICES[0]!;
}
