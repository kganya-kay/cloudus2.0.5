import type { ServiceSlug } from "./catalog";

export type StackItem = {
  name: string;
  use: string;
};

export type StackGroup = {
  id: string;
  name: string;
  services: ServiceSlug[];
  items: StackItem[];
};

export const CLOUDUS_STACK: StackGroup[] = [
  {
    id: "crm",
    name: "CRM & revenue cloud",
    services: ["build", "market", "shop"],
    items: [
      { name: "Salesforce Sales Cloud", use: "Account hierarchy, pipeline, quotes, and enterprise handover" },
      { name: "Salesforce Service Cloud", use: "Case routing, SLAs, and after-care for delivered work" },
      { name: "Salesforce Experience Cloud", use: "Client portals that sit next to Cloudus rooms and shops" },
      { name: "Salesforce Marketing Cloud / Account Engagement", use: "Nurture journeys that match Cloudus campaigns" },
      { name: "Salesforce CPQ", use: "Configurable packages for Build, Studio, and retainers" },
      { name: "Salesforce Data Cloud", use: "Unify shop, project, and campaign signals without mixing PCI" },
      { name: "Salesforce Flow + Apex + LWC", use: "Custom automation and Lightning UI for the client org" },
      { name: "SOQL / SOSL", use: "Governed queries; never against restricted production PII orgs" },
      { name: "jsforce", use: "Typed Salesforce API work from Node when the client authorises an org" },
      { name: "MuleSoft", use: "System APIs between Salesforce, Paystack, and Cloudus" },
      { name: "Agentforce", use: "Guided assistants on the client’s own Salesforce boundary" },
    ],
  },
  {
    id: "app",
    name: "Product & platforms",
    services: ["build", "shop", "rooms", "laundry", "market"],
    items: [
      { name: "TypeScript", use: "End-to-end typed product surface" },
      { name: "React 18", use: "Client OS, admin, and campaign desks" },
      { name: "Next.js 15 App Router", use: "SSR, route handlers, and Vercel edge" },
      { name: "tRPC 11", use: "Typed procedures for hire, fulfil, outreach" },
      { name: "Prisma 6", use: "Postgres schema, migrations, fulfilment records" },
      { name: "PostgreSQL / Neon", use: "Transactional store for orders, projects, campaigns" },
      { name: "TanStack Query", use: "Live desks without extra REST glue" },
      { name: "Zod", use: "Runtime contracts on every public mutation" },
      { name: "Tailwind CSS", use: "OS design tokens and campaign UI" },
      { name: "TipTap", use: "Book canvas and long-form briefs" },
    ],
  },
  {
    id: "identity",
    name: "Identity & access",
    services: ["build", "rooms", "shop", "market"],
    items: [
      { name: "NextAuth v5", use: "Session, roles, guest checkout" },
      { name: "RBAC", use: "ADMIN / CARETAKER / SUPPLIER / CUSTOMER / DRIVER" },
      { name: "OAuth 2.0 / OIDC", use: "LinkedIn, Meta, and Salesforce connected apps" },
      { name: "JWT", use: "Short-lived session tokens" },
      { name: "POPIA", use: "Consent source, unsubscribe, no harvested inboxes" },
    ],
  },
  {
    id: "pay",
    name: "Payments & fulfilment",
    services: ["shop", "laundry", "market", "events", "rooms"],
    items: [
      { name: "Paystack", use: "ZAR checkout already live on Cloudus orders" },
      { name: "Stripe", use: "Card rails where the client already settles in Stripe" },
      { name: "Ozow", use: "EFT instant pay for South African buyers" },
      { name: "PCI isolation", use: "Card data stays with the processor; Cloudus stores status only" },
      { name: "Webhooks", use: "PAID → project + tasks + notify, unchanged payment core" },
    ],
  },
  {
    id: "media",
    name: "Studio, live & daily",
    services: ["studio", "daily", "events", "blog"],
    items: [
      { name: "WebRTC + STUN", use: "In-app live rooms and call tiles" },
      { name: "YouTube IFrame API", use: "Daily TV autoplay window" },
      { name: "UploadThing", use: "Image, video, and audio for books and posts" },
      { name: "html-to-image", use: "Newspaper cards for social handoff" },
      { name: "Meta Graph API", use: "Facebook Page + Instagram professional publishing" },
      { name: "LinkedIn UGC API", use: "Scheduled thought-leadership from the OS" },
    ],
  },
  {
    id: "growth",
    name: "Growth orchestration",
    services: ["market", "daily", "blog", "build"],
    items: [
      { name: "Vercel AI SDK", use: "Captions and campaign copy from live Cloudus context" },
      { name: "OpenAI", use: "Model routing for outreach drafts" },
      { name: "SendGrid", use: "Transactional and campaign mail with unsubscribe" },
      { name: "React Email", use: "Typed HTML mail that matches the OS" },
      { name: "OpenStreetMap / Nominatim / Overpass", use: "Public business map around a city — published tags only" },
      { name: "Vercel Cron", use: "Daily post, discover, and send loop" },
    ],
  },
  {
    id: "ops",
    name: "Delivery & cloud",
    services: ["build", "laundry", "rooms", "events"],
    items: [
      { name: "Vercel", use: "App hosting, crons, previews" },
      { name: "GitHub", use: "Mainline delivery for the managed OS" },
      { name: "REST + GraphQL", use: "Client system integration without rewriting Cloudus payments" },
      { name: "Webhooks / queues", use: "Fulfilment and outreach jobs" },
      { name: "Tableau / Slack", use: "Client reporting and war-room alerts when they already run them" },
    ],
  },
];

export function stackForService(slug?: ServiceSlug | null) {
  if (!slug) return CLOUDUS_STACK;
  const matched = CLOUDUS_STACK.filter((group) => group.services.includes(slug));
  return matched.length ? matched : CLOUDUS_STACK;
}

export function allStackNames() {
  return CLOUDUS_STACK.flatMap((group) => group.items.map((item) => item.name));
}
