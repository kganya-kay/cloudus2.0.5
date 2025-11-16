import Link from "next/link";
import { Metadata } from "next";

import { HydrateClient, api } from "~/trpc/server";
import { MarketplaceTasksPanel } from "../_components/MarketplaceTasksPanel";
import { LaundryOrderClient } from "./laundry-order-client";

export const metadata: Metadata = {
  title: "Laundry Service | Cloudus",
  description:
    "Book laundry pickups with Cloudus. Share your pickup location, pay securely, and track progress in one place.",
};

export default async function LaundryPage() {
  const [announcements, featuredCreators] = await Promise.all([
    api.platform.announcements({ limit: 3 }),
    api.creator.featured(),
  ]);

  return (
    <HydrateClient>
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <section className="rounded-3xl border bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600">Cloudus laundry</p>
              <h1 className="text-3xl font-bold text-gray-900">
                Door-to-door laundry, synced with creators & drivers.
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Share pickup details, confirm weight, pay securely, and tap into the feed to keep suppliers and
                drivers aligned.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-700">
                <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Pickup & delivery</span>
                <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Live status</span>
                <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Creator updates</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/feed"
                  className="rounded-full bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
                >
                  View feed
                </Link>
                <Link
                  href="/projects/create"
                  className="rounded-full border border-blue-200 px-4 py-2 font-semibold text-blue-700"
                >
                  Launch a project
                </Link>
              </div>
            </div>
            <div className="rounded-2xl bg-white/70 p-4 text-sm text-gray-700 shadow-sm">
              <p className="font-semibold text-gray-900">Need recurring pickups or bulk service?</p>
              <p className="text-xs text-gray-500">
                Chat to our team for offices, care facilities, or creator collaborations.
              </p>
              <Link
                href="https://wa.me/27640204765"
                target="_blank"
                className="mt-3 inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                WhatsApp support
              </Link>
              <div className="mt-4 space-y-2 text-xs text-gray-500">
                <p className="font-semibold text-gray-900">Announcements</p>
                {(announcements ?? []).length === 0 ? (
                  <p>No announcements right now.</p>
                ) : (
                  (announcements ?? []).map((announcement) => (
                    <p key={announcement.id}>
                      <span className="font-semibold text-gray-800">{announcement.title}:</span> {" "}
                      {announcement.body}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Creator & supplier highlights</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(featuredCreators ?? []).slice(0, 4).map((creator) => (
                <article
                  key={creator.id}
                  className="rounded-2xl border border-blue-50 bg-blue-50/60 p-3 text-sm text-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        creator.avatarUrl ??
                        creator.user?.image ??
                        "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV"
                      }
                      alt={creator.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{creator.displayName}</p>
                      <p className="text-xs text-gray-500">@{creator.handle}</p>
                    </div>
                  </div>
                  {creator.tagline && (
                    <p className="mt-2 text-xs text-gray-600 line-clamp-2">{creator.tagline}</p>
                  )}
                </article>
              ))}
              {(featuredCreators ?? []).length === 0 && (
                <p className="text-sm text-gray-500">
                  No creator stories yet. Head to {" "}
                  <Link href="/feed" className="text-blue-600 underline">
                    the feed
                  </Link>{" "}
                  to see what others are launching.
                </p>
              )}
            </div>
          </div>
          <MarketplaceTasksPanel role="DRIVER" limit={4} title="Available logistics tasks" />
        </section>

        <section className="grid gap-6 md:grid-cols-2" id="track">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">What's included</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• Wash, dry, fold, and optional pressing</li>
              <li>• Drivers collect and drop off at your preferred time</li>
              <li>• ETA and payment updates inside your dashboard</li>
            </ul>
            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
              Weight entered here is an estimate. We confirm the final weight at the supplier and adjust billing if
              required.
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
              <li>Submit the form with your pickup details.</li>
              <li>Pay securely online to confirm the booking.</li>
              <li>Track supplier assignment, driver pickup, and delivery.</li>
            </ol>
            <p className="mt-3 text-xs text-gray-500">
              Typical turnaround is 24-48 hours depending on selected service and weight.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Place a laundry order</h2>
          <p className="text-sm text-gray-600">We'll confirm your supplier and send updates as your order progresses.</p>
          <div className="mt-6">
            <LaundryOrderClient />
          </div>
        </section>
      </main>
    </HydrateClient>
  );
}
