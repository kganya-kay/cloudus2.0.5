// ===== app/(dashboard)/page.tsx — SERVER COMPONENT =====
import { auth } from "~/server/auth";
export const dynamic = "force-dynamic";
import { api, HydrateClient } from "~/trpc/server";
import DashboardShell from "./DashboardShell";
import ToastBanner from "./_components/ToastBanner";

export default async function Page(props: any) {
  const session = await auth();
  const user = {
    name: session?.user?.name ?? "Guest",
    image:
      session?.user?.image ??
      "https://utfs.io/f/zFJP5UraSTwKBuHG8YfZ251G9IiAMecW3arLHdOuYKx6EClV",
    email: session?.user?.email ?? "",
  };

  // Optional: server-side prefetch to warm tRPC cache
  if (session?.user) {
    await api.post.getLatest.prefetch();
  }

  const [featuredCreators, announcements] = await Promise.all([
    api.creator.featured(),
    api.platform.announcements({ limit: 3 }),
  ]);

  const toastKey = (props?.searchParams?.toast as string) ?? null;

  return (
    <HydrateClient>
      {toastKey === "login_required" && (
        <ToastBanner variant="warning" message="You need to log in to see your profile." />
      )}
      <DashboardShell
        user={user}
        session={!!session}
        featuredCreators={featuredCreators}
        announcements={announcements}
      />
    </HydrateClient>
  );
}

