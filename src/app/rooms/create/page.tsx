import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { RoomCreateForm } from "../_components/RoomCreateForm";

export default async function CreateRoomPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  return (
    <HydrateClient>
      <div className="bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <RoomCreateForm />
        </div>
      </div>
    </HydrateClient>
  );
}
