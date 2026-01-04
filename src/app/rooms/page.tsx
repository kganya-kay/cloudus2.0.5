import Link from "next/link";
import { api, HydrateClient } from "~/trpc/server";

export default async function RoomsPage() {
  const { rooms } = await api.room.list({ take: 24 });

  return (
    <HydrateClient>
      <div className="bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-blue-600">Rooms</p>
            <h1 className="text-3xl font-bold text-gray-900">
              Stay with Cloudus hosts.
            </h1>
            <p className="text-sm text-gray-600">
              Browse verified spaces with location, gallery, and nightly rates. Book directly with
              hosts.
            </p>
            <div className="flex gap-3">
              <Link
                href="/rooms/create"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                List your room
              </Link>
              <Link
                href="/shop"
                className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Back to marketplace
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {room.monthlyRateCents && room.monthlyRateCents > 0 && (
                  <div className="absolute right-3 top-3 z-10 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow">
                    Monthly: {room.currency} {(room.monthlyRateCents / 100).toFixed(0)}
                  </div>
                )}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={room.coverImage ?? room.gallery[0] ?? "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"}
                    alt={room.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute left-2 top-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 shadow">
                    {room.currency} {(room.nightlyRateCents / 100).toFixed(0)} / night
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{room.title}</h3>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {room.maxGuests} guests
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-600">{room.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{room.address?.city ?? "Location on request"}</span>
                    <span className="text-blue-600">View</span>
                  </div>
                </div>
              </Link>
            ))}
            {rooms.length === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-blue-200 bg-blue-50/60 p-6 text-center text-sm text-blue-700">
                No rooms listed yet. Be the first to{" "}
                <Link href="/rooms/create" className="font-semibold underline">
                  list your space
                </Link>
                .
              </div>
            )}
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
