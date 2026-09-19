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
      <BlogComposer
        routeUserName={routeUserName}
        sessionUserName={session?.user?.name ?? session?.user?.email?.split("@")[0] ?? null}
        isSignedIn={Boolean(session?.user)}
      />
    </HydrateClient>
  );
}
