// src/app/admin/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { HydrateClient, api } from "~/trpc/server";
import AdminBoard from "./_components/AdminBoard";
import AdminSummary from "./_components/AdminSummary";
import AdminManualOrder from "./_components/AdminManualOrder";
import { MarketplaceTasksPanel } from "../_components/MarketplaceTasksPanel";

export default async function AdminHome() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  const [announcements, reviewQueue, feedPreview] = await Promise.all([
    db.adminAnnouncement.findMany({
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    db.adminReviewQueue.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        feedPost: {
          select: {
            id: true,
            title: true,
            caption: true,
            creator: { select: { displayName: true, handle: true } },
          },
        },
        project: { select: { id: true, name: true } },
        shopItem: { select: { id: true, name: true } },
        reviewer: { select: { name: true } },
      },
    }),
    api.feed.list({ limit: 3 }),
  ]);

  return (
    <HydrateClient>
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600">Cloudus studio ops</p>
              <h1 className="text-3xl font-bold text-gray-900">Monitor creator feed, tasks, and payouts.</h1>
              <p className="text-sm text-gray-600">
                Review creator posts, publish announcements, and steer suppliers/drivers across the marketplace.
              </p>
            </div>
            <Link
              href="/feed"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              View public feed
            </Link>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <Link
            href="/admin/suppliers"
            className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50"
          >
            Suppliers
          </Link>
          <Link
            href="/admin/drivers"
            className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50"
          >
            Drivers
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50"
          >
            Orders
          </Link>
          <Link
            href="/admin/shopitems"
            className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50"
          >
            Shop Items
          </Link>
          <Link
            href="/admin/reports"
            className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50"
          >
            Reports
          </Link>
          <Link
            href="/admin/users"
            className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50"
          >
            Users
          </Link>
          <Link
            href="/admin/applications"
            className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50"
          >
            Applications
          </Link>
          <Link
            href="/admin/rooms"
            className="rounded-xl border bg-white p-3 text-center text-sm font-semibold hover:bg-gray-50"
          >
            Rentals
          </Link>
        </div>

        <section className="grid gap-4 rounded-3xl border border-gray-100 bg-white/80 p-4 shadow-sm lg:grid-cols-[2fr,1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Creator feed</p>
            <div className="mt-2 space-y-3">
              {feedPreview.items.slice(0, 3).map((post) => (
                <article key={post.id} className="rounded-2xl border border-blue-50 bg-blue-50/60 p-3 text-sm">
                  <p className="text-xs uppercase text-gray-500">{post.type.replaceAll("_", " ")}</p>
                  <p className="font-semibold text-gray-900">
                    {post.title ?? post.project?.name ?? "Update"}{" "}
                    <span className="text-xs text-gray-500">by {post.creator.displayName}</span>
                  </p>
                  {post.caption && <p className="text-xs text-gray-600 line-clamp-2">{post.caption}</p>}
                  <Link href={`/feed`} className="mt-1 inline-flex text-xs font-semibold text-blue-700">
                    View on feed →
                  </Link>
                </article>
              ))}
              {feedPreview.items.length === 0 && (
                <p className="text-sm text-gray-500">No feed stories yet. Encourage creators to publish updates.</p>
              )}
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-dashed border-gray-200 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Announcements</p>
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-500">No announcements. Publish one via /admin.</p>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-xl bg-blue-50/60 p-3 text-xs text-gray-700">
                  <p className="font-semibold text-gray-900">{announcement.title}</p>
                  <p>{announcement.body}</p>
                </div>
              ))
            )}
            <Link
              href="/admin/announcements"
              className="inline-flex text-xs font-semibold text-blue-700 hover:underline"
            >
              Manage announcements →
            </Link>
          </div>
        </section>

        <MarketplaceTasksPanel role="SUPPLIER" limit={6} title="Marketplace tasks (ops view)" />

        <section className="rounded-3xl border border-gray-100 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Review queue</p>
              <h2 className="text-lg font-semibold text-gray-900">Pending approvals</h2>
            </div>
            <Link href="/feed" className="text-xs font-semibold text-blue-700">
              Open feed →
            </Link>
          </div>
          {reviewQueue.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No content awaiting review.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {reviewQueue.map((item) => (
                <article key={item.id} className="rounded-2xl border border-dashed border-red-200 p-3 text-sm">
                  <p className="text-xs uppercase text-red-600">Pending</p>
                  {item.feedPost ? (
                    <>
                      <p className="font-semibold text-gray-900">
                        Feed post: {item.feedPost.title ?? "Untitled"}
                      </p>
                      <p className="text-xs text-gray-500">
                        @{item.feedPost.creator.handle} — {item.feedPost.caption ?? "No caption"}
                      </p>
                    </>
                  ) : item.project ? (
                    <p className="font-semibold text-gray-900">Project: {item.project.name}</p>
                  ) : item.shopItem ? (
                    <p className="font-semibold text-gray-900">Shop item: {item.shopItem.name}</p>
                  ) : null}
                  <p className="text-xs text-gray-500">Submitted {item.createdAt.toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <AdminSummary />
        <AdminManualOrder />
        <AdminBoard />
      </main>
    </HydrateClient>
  );
}
