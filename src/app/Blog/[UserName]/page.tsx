import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

import BlogComposer from "./BlogComposer";

type PageProps = {
  params: Promise<{ UserName: string }>;
};

export default async function UserBlogPage({ params }: PageProps) {
  const { UserName } = await params;
  const routeUserName = decodeURIComponent(UserName);
  const session = await auth();

  await Promise.all([
    api.blog.profile.prefetch({ userName: routeUserName }),
    api.blog.listPosts.prefetch({
      userName: routeUserName,
      includeDrafts: Boolean(session?.user),
      limit: 20,
    }),
  ]);

  return (
    <HydrateClient>
      <main className="mx-auto min-h-[70vh] w-full max-w-3xl px-4 py-10">
        <BlogComposer
          routeUserName={routeUserName}
          sessionUserName={session?.user?.name ?? null}
          isSignedIn={Boolean(session?.user)}
        />
      </main>
    </HydrateClient>
  );
}
