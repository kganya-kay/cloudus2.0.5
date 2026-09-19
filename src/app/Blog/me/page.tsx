import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export const dynamic = "force-dynamic";

export default async function MyBlogPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/Blog/me");
  }

  const blog = await api.blog.ensureMine();
  redirect(`/Blog/${blog.userName}`);
}
