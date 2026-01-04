import { notFound } from "next/navigation";
import { HydrateClient, api } from "~/trpc/server";
import { RoomBookingForm } from "../_components/RoomBookingForm";

type ParamsInput = { roomId: string };
type SearchParamsInput = { payment?: string | string[] };

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params?: Promise<ParamsInput>;
  searchParams?: Promise<SearchParamsInput>;
}) {
  const resolvedParams = params ? await params : undefined;
  if (!resolvedParams?.roomId) {
    notFound();
  }

  const resolvedSearch = searchParams ? await searchParams : undefined;

  const room = await api.room.byId({ id: resolvedParams.roomId });

  if (!room) {
    notFound();
  }

  const gallery = room.media.length ? room.media.map((m) => m.url) : room.gallery;

  const paymentRaw = resolvedSearch?.payment;
  const paymentState = Array.isArray(paymentRaw) ? paymentRaw[0] : paymentRaw;

  return (
    <HydrateClient>
      <div className="bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {paymentState && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                paymentState === "success"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {paymentState === "success"
                ? "Payment received. Your booking is confirmed."
                : "Payment cancelled or failed. Your booking is pending until payment succeeds."}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-blue-600">Room</p>
            <h1 className="text-3xl font-bold text-gray-900">{room.title}</h1>
            <p className="text-sm text-gray-600">
              {room.address?.city}, {room.address?.province ?? room.address?.country}
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-800">
              {room.monthlyRateCents ? (
                <>
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    {room.currency} {(room.monthlyRateCents / 100).toFixed(0)} / month
                  </span>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {room.currency} {(room.nightlyRateCents / 100).toFixed(2)} / night
                  </span>
                </>
              ) : (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {room.currency} {(room.nightlyRateCents / 100).toFixed(2)} / night
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <img
                  src={room.coverImage ?? gallery[0] ?? "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"}
                  alt={room.title}
                  className="h-72 w-full object-cover"
                />
              </div>

              {gallery.length > 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {gallery.slice(1, 5).map((url, idx) => (
                    <div key={idx} className="overflow-hidden rounded-lg border border-gray-200">
                      <img src={url} alt={`${room.title} ${idx}`} className="h-32 w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">About this place</h2>
                <p className="mt-2 text-sm text-gray-700">{room.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700 sm:grid-cols-3">
                  <span>Guests: {room.maxGuests}</span>
                  <span>Bedrooms: {room.bedrooms}</span>
                  <span>Beds: {room.beds}</span>
                  <span>Bathrooms: {room.bathrooms}</span>
                </div>
                {room.amenities.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-900">Amenities</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {room.amenities.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {room.houseRules.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-900">House rules</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {room.houseRules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <RoomBookingForm
                roomId={room.id}
                nightlyRateCents={room.nightlyRateCents}
                cleaningFeeCents={room.cleaningFeeCents}
                currency={room.currency}
                maxGuests={room.maxGuests}
              />

              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">Host</h3>
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={
                      room.host?.image ??
                      "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"
                    }
                    alt={room.host?.name ?? "Host"}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{room.host?.name ?? "Host"}</p>
                    {room.host?.email && (
                      <p className="text-sm text-gray-600">{room.host.email}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  Your request will be sent to the host. Overlapping bookings are blocked to prevent
                  double-booking.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
