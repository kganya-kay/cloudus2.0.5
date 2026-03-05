import Link from "next/link";

import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default async function BlogDirectoryPage() {
  const session = await auth();
  const items = await api.blog.listPublicBlogs({ limit: 36 });

  const sessionName = session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "my-blog";
  const myBlogHref = `/Blog/${normalizeName(sessionName) || "my-blog"}`;

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 py-10">
      <header className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-blue-600">Blog Directory</p>
        <h1 className="mt-1 text-3xl font-semibold text-gray-900">Public blogs on Cloudus</h1>
        <p className="mt-2 text-sm text-gray-600">
          Browse published blogs and open a creator page at <span className="font-mono">/Blog/{"{UserName}"}</span>.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={myBlogHref}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Open my blog
          </Link>
          <Link
            href="/feed"
            className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            Back to feed
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900">No public blogs yet</h2>
          <p className="mt-2 text-sm text-gray-600">
            Publish your first post to appear in this directory.
          </p>
        </section>
      ) : (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.blog.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <img
                  src={
                    item.blog.owner.image ??
                    "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV"
                  }
                  alt={item.blog.owner.name ?? item.blog.userName}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item.blog.owner.name ?? item.blog.userName}
                  </p>
                  <p className="truncate text-xs text-gray-500">@{item.blog.userName}</p>
                </div>
              </div>

              <h2 className="mt-4 line-clamp-2 text-lg font-semibold text-gray-900">{item.blog.title}</h2>
              {item.blog.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.blog.description}</p>
              )}

              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Latest post</p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">
                  {item.latestPost.title}
                </p>
                {item.latestPost.excerpt && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{item.latestPost.excerpt}</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-gray-500">{item.publishedPostCount} published posts</span>
                <Link
                  href={`/Blog/${item.blog.userName}`}
                  className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700"
                >
                  Open blog
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
