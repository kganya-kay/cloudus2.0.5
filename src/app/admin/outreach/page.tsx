import { redirect } from "next/navigation";

import { HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import { OutreachDesk } from "~/components/outreach/OutreachDesk";

export const dynamic = "force-dynamic";

export default async function AdminOutreachPage() {
  const session = await auth();
  const role = session?.user.role;
  if (!role || (role !== "ADMIN" && role !== "CARETAKER")) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <OutreachDesk />
    </HydrateClient>
  );
}
