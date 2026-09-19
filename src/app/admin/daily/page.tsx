import { redirect } from "next/navigation";

import { HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";

import { DailyEditionClient } from "./daily-edition-client";

export const dynamic = "force-dynamic";

export default async function AdminDailyPage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <DailyEditionClient />
    </HydrateClient>
  );
}
