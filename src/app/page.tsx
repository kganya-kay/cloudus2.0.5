// ===== app/(dashboard)/page.tsx — SERVER COMPONENT =====
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import DashboardShell from "./DashboardShell";

export default async function Page() {
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

  return (
    <HydrateClient>
      <DashboardShell user={user} session={!!session} />
    </HydrateClient>
  );
}

