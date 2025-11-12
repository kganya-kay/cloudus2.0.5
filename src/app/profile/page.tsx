// src/app/profile/page.tsx
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export const dynamic = "force-dynamic";

export default async function ProfileIndex() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  if (!email) return redirect("/?toast=login_required");
  return redirect(`/profile/${encodeURIComponent(email)}`);
}

