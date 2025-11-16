import Link from "next/link";

import { HydrateClient, api } from "~/trpc/server";
import { FeedClient } from "./feed-client";

export default async function FeedPage() {
  const [featuredCreators, announcements] = await Promise.all([
    api.creator.featured(),
    api.platform.announcements({ limit: 3 }),
  ]);

  return (
    <HydrateClient>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-0">
        <header className="space-y-3 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-blue-600">Cloudus Creator Feed</p>
          <h1 className="text-3xl font-semibold text-gray-900">
            Showcase your drops, tasks, and collabs.
          </h1>
          <p className="text-sm text-gray-600">
            Scroll to discover creator updates across projects, shop drops, drivers, suppliers, and
            laundry ops. Share your own story from the creator dashboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/creators/dashboard"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Publish an update
            </Link>
            <Link
              href="/projects/create"
              className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700"
            >
              Launch a project
            </Link>
          </div>
        </header>

        {announcements.length > 0 && (
          <section className="rounded-3xl border border-dashed border-blue-200 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Studio updates
            </p>
            <div className="mt-3 space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-2xl border border-blue-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">{announcement.title}</p>
                  <p className="text-sm text-gray-600">{announcement.body}</p>
                  {announcement.link && (
                    <Link
                      href={announcement.link}
                      className="mt-1 inline-flex text-xs font-semibold text-blue-600"
                    >
                      Learn more →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {featuredCreators.length > 0 && (
          <section className="space-y-3 rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Creator spotlight</p>
                <h2 className="text-lg font-semibold text-gray-900">Top collaborators</h2>
              </div>
              <Link
                href="/creators/dashboard"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Become a creator →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCreators.slice(0, 6).map((creator) => (
                <article
                  key={creator.id}
                  className="rounded-2xl border border-blue-50 bg-gradient-to-br from-white to-blue-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        creator.avatarUrl ??
                        creator.user?.image ??
                        "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV"
                      }
                      alt={creator.displayName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{creator.displayName}</p>
                      <p className="text-xs text-gray-500">@{creator.handle}</p>
                    </div>
                  </div>
                  {creator.tagline && (
                    <p className="mt-3 text-sm text-gray-700 line-clamp-2">{creator.tagline}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                    {creator.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <FeedClient />
      </div>
    </HydrateClient>
  );
}
