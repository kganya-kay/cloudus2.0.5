"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { MarketplaceTasksPanel } from "~/app/_components/MarketplaceTasksPanel";
import { FeedSnippetsPanel } from "~/app/_components/FeedSnippetsPanel";
import { AssistantOverlay } from "~/app/_components/AssistantOverlay";
import { api } from "~/trpc/react";

function formatZAR(cents?: number | null) {
  if (cents == null) return "R 0";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(Math.round(cents / 100));
  } catch {
    return `R ${Math.round(cents / 100)}`;
  }
}

function useItemId(): number | null {
  const params = useParams<{ itemId?: string | string[] }>();
  const raw = Array.isArray(params?.itemId) ? params?.itemId?.[0] : params?.itemId;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ShopItemDetailPage() {
  const itemId = useItemId();
  const announcementsQuery = api.platform.announcements.useQuery({ limit: 3 });
  const itemQuery = api.shopItem.getById.useQuery(
    { id: itemId ?? -1 },
    { enabled: itemId != null },
  );

  const item = itemQuery.data;
  const supplier = item?.supplier;
  const announcements = announcementsQuery.data ?? [];

  const quickLinks = useMemo(
    () => [
      {
        title: "Place an order",
        href: `/shop/orders/${itemId ?? ""}`,
        description: "Launch a secure checkout and track fulfilment.",
      },
      {
        title: "Concierge assist",
        href: `/shop/orders/${itemId ?? ""}/create`,
        description: "Let a caretaker capture the request for you.",
      },
      {
        title: "Driver assignments",
        href: "/drivers/dashboard",
        description: "Manage pickup logistics and live tracking.",
      },
      {
        title: "Creator marketplace",
        href: "/projects",
        description: "Invite contributors for marketing, content, and more.",
      },
    ],
    [itemId],
  );

  if (itemId == null) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Invalid item id in the URL.
        </p>
        <div className="mt-4">
          <Link
            href="/shop"
            className="rounded-full bg-gray-700 px-6 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

return (
  <>
    <div className="min-h-screen bg-slate-50">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-600 via-blue-700 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle,_rgba(255,255,255,0.35),_transparent_70%)]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Cloudus shop</p>
          <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                {item ? item.name : "Loading experience..."}
              </h1>
              <p className="text-sm text-white/80">
                Services built for creators, suppliers, and operators. Reserve the package,
                collaborate with contributors, and convert sales on the same platform.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/shop/orders/${itemId}`}
                  className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30"
                >
                  Launch order
                </Link>
                <Link
                  href="/feed"
                  className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  View feed
                </Link>
                <Link
                  href="/projects"
                  className="rounded-full bg-indigo-900/40 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-900/60"
                >
                  Explore tasks
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">Starting from</p>
              <p className="text-3xl font-semibold">{formatZAR(item?.price)}</p>
              <p className="mt-1 text-white/70">
                Includes Cloudus caretakers, logistics coordination, and supplier payouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              {itemQuery.isLoading ? (
                <p className="text-sm text-gray-500">Loading package…</p>
              ) : item ? (
                <>
                  <div className="flex flex-col gap-5 md:flex-row">
                    <div className="relative h-48 w-full overflow-hidden rounded-3xl md:w-1/2">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                    <div className="space-y-4 md:w-1/2">
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        About this experience
                      </p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="grid gap-3 text-sm text-gray-600">
                        <div className="rounded-2xl border border-dashed px-4 py-3">
                          <p className="text-xs uppercase text-gray-500">Category</p>
                          <p className="font-semibold text-gray-900">{item.type}</p>
                        </div>
                        <div className="rounded-2xl border border-dashed px-4 py-3">
                          <p className="text-xs uppercase text-gray-500">Supplier</p>
                          <p className="font-semibold text-gray-900">
                            {supplier?.name ?? "Cloudus Ops"}
                          </p>
                          {(supplier?.suburb || supplier?.city) && (
                            <p className="text-xs text-gray-500">
                              {supplier?.suburb}, {supplier?.city}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/shop/orders/${itemId}`}
                          className="rounded-full bg-blue-600 px-6 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Book now
                        </Link>
                        <Link
                          href={`/shop/orders/${itemId}/create`}
                          className="rounded-full border border-blue-600 px-6 py-2 text-xs font-semibold text-blue-700"
                        >
                          Request via caretaker
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Item not found.</p>
              )}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Recent fulfilment</p>
                  <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
                </div>
                <Link href="/shop" className="text-xs font-semibold text-blue-700">
                  Back to shop
                </Link>
              </header>
              {item?.orders && item.orders.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {item.orders.slice(0, 6).map((order) => (
                    <li
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed px-4 py-3 text-sm text-gray-600"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">Order #{order.id}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase text-gray-500">{order.status}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatZAR(order.price)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Once this experience gets booked we will show fulfilment data here.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-blue-100 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600">
                    Announcements
                  </p>
                  <p className="text-sm text-gray-600">Ops + strategy notes</p>
                </div>
                <Link href="/feed" className="text-xs font-semibold text-blue-700">
                  Feed
                </Link>
              </div>
              {announcementsQuery.isLoading ? (
                <p className="mt-3 text-sm text-gray-500">Loading updates...</p>
              ) : announcements.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No new announcements.</p>
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

            <FeedSnippetsPanel
              title="Feed stories"
              subtitle="Creators shipping work"
              className="border-purple-100"
            />

            <section className="rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Quick links</p>
              <ul className="mt-3 space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex flex-col rounded-2xl border border-gray-100 px-4 py-3 transition hover:border-blue-200"
                    >
                      <span className="text-sm font-semibold text-gray-900">{link.title}</span>
                      <span className="text-xs text-gray-600">{link.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <MarketplaceTasksPanel
              role="CREATOR"
              limit={4}
              title="Need talent?"
              subtitle="Invite Cloudus contributors to scale this service."
            />
          </aside>
        </div>
      </div>
    </div>
    <AssistantOverlay
  taxonomy={[
    { label: "Shop feed", description: "Featured shop drops & orders.", href: "/feed" },
    { label: "Projects", description: "Convert bespoke projects into services.", href: "/projects" },
    { label: "Suppliers", description: "Manage fulfilment partners.", href: "/suppliers/dashboard" },
  ]}
/>
  </>
);
}
