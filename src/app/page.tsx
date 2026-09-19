import { OsHome } from "./(os)/_components/os-home";
import ToastBanner from "./_components/ToastBanner";

export const dynamic = "force-dynamic";

export default async function HomePage(props: {
  searchParams?: Promise<{ toast?: string }> | { toast?: string };
}) {
  const params = await Promise.resolve(props.searchParams ?? {});
  const toastKey = params.toast ?? null;

  return (
    <>
      {toastKey === "login_required" ? (
        <div className="mb-4">
          <ToastBanner variant="warning" message="Sign in to see your profile." />
        </div>
      ) : null}
      <OsHome />
    </>
  );
}
