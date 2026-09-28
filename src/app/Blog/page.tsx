import { PencilSquareIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { BookShelf } from "~/components/blog/BookShelf";
import { BloggerNav } from "~/components/social/BloggerNav";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function BlogDirectoryPage() {
  const session = await auth();
  const recent = await api.blog.listRecentPosts({ limit: 36 }).catch(() => []);
  const writeHref = session?.user ? "/Blog/me" : "/auth/login?callbackUrl=/Blog/me";

  return (
    <div className="life-desk space-y-8">
      <div className="flex items-center justify-between gap-3">
        <BloggerNav current="community" />
        <Link
          href={writeHref}
          aria-label="Write"
          className="grid h-11 w-11 place-items-center rounded-full bg-os-fg text-os-bg dark:bg-white dark:text-zinc-950"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </Link>
      </div>

      {recent.length > 0 ? (
        <BookShelf
          books={recent.map((post) => ({
            href: `/Blog/${post.blog.userName}/${post.slug}`,
            title: post.title,
            author: post.blog.owner.name ?? post.blog.userName,
            image: post.coverImage,
          }))}
        />
      ) : (
        <div className="flex justify-center">
          <Link
            href={writeHref}
            aria-label="Write"
            className="grid h-14 w-14 place-items-center rounded-full border border-os-border bg-os-card"
          >
            <PencilSquareIcon className="h-6 w-6" />
          </Link>
        </div>
      )}
    </div>
  );
}
