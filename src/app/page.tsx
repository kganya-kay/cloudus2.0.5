import { MediaPulse } from "~/components/media-pulse/MediaPulse";
import { api } from "~/trpc/server";

import { OsHome } from "./(os)/_components/os-home";
import ToastBanner from "./_components/ToastBanner";

export const dynamic = "force-dynamic";

export default async function HomePage(props: {
  searchParams?: Promise<{ toast?: string }>;
}) {
  const params = (await props.searchParams) ?? {};
  const toastKey = params.toast ?? null;
  const pulse = await api.mediaPulse.frontpage({}).catch(() => null);

  return (
    <div className="space-y-6">
      {toastKey === "login_required" ? (
        <ToastBanner variant="warning" message="Sign in to see your profile." />
      ) : null}
      <MediaPulse initial={pulse} />
      <OsHome />
    </div>
  );
}
