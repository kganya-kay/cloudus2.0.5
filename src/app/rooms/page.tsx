import Link from "next/link";
import { api, HydrateClient } from "~/trpc/server";
import { formatZarFromCents } from "~/lib/os/format";
import { Badge, Button, Card, EmptyState, PageHeader } from "~/components/os/primitives";

export default async function RoomsPage() {
  const listed = await api.room.list({ take: 24 }).catch(() => ({ rooms: [] as Awaited<ReturnType<typeof api.room.list>>["rooms"] }));
  const rooms = listed.rooms ?? [];

  return (
    <HydrateClient>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Stay"
          title="Rentals"
          description="Approved rooms with nightly rates. Booking and Paystack stay on the existing room flow."
          actions={<Button href="/rooms/create">List a room</Button>}
        />
        {rooms.length === 0 ? (
          <EmptyState
            title="No rooms listed"
            description="Hosts submit a listing. Admin approval publishes it here."
            action={<Button href="/rooms/create" size="sm">List your space</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`}>
                <Card className="h-full overflow-hidden p-0">
                  <img
                    src={room.coverImage ?? room.gallery?.[0] ?? "/cloudus-logo-final.png"}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                  <div className="space-y-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold">{room.title}</h2>
                      <Badge tone="accent">{formatZarFromCents(room.nightlyRateCents)} / night</Badge>
                    </div>
                    <p className="os-muted line-clamp-2">{room.description}</p>
                    <p className="text-xs text-os-muted">{room.address?.city ?? "Location on request"}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </HydrateClient>
  );
}
