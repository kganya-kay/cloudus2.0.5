import { redirect } from "next/navigation";

export default async function HireRedirect(props: {
  searchParams?: Promise<{ s?: string }>;
}) {
  const params = (await props.searchParams) ?? {};
  const slug = params.s ? `?s=${encodeURIComponent(params.s)}` : "";
  redirect(`/services${slug}`);
}
