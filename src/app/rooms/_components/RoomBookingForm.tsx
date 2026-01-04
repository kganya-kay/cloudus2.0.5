"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";

type Props = {
  roomId: string;
  nightlyRateCents: number;
  cleaningFeeCents?: number | null;
  currency?: string | null;
  maxGuests: number;
};

export function RoomBookingForm({
  roomId,
  nightlyRateCents,
  cleaningFeeCents = 0,
  currency = "ZAR",
  maxGuests,
}: Props) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState<string | null>(null);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  }, [checkIn, checkOut]);

  const totalCents = useMemo(() => {
    const base = nights * nightlyRateCents;
    return base + (cleaningFeeCents ?? 0);
  }, [nights, nightlyRateCents, cleaningFeeCents]);

  const bookMutation = api.room.book.useMutation({
    onSuccess: async (booking) => {
      setNote("Redirecting to payment...");

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const successUrl = origin ? `${origin}/rooms/${roomId}?payment=success` : undefined;
      const cancelUrl = origin ? `${origin}/rooms/${roomId}?payment=cancelled` : undefined;

      try {
        const response = await fetch("/api/bookings/paystack/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            successUrl,
            cancelUrl,
          }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          setNote(data?.error ?? "Unable to start payment. Please try again.");
          return;
        }
        const data = (await response.json()) as { checkoutUrl: string };
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          setNote("Payment link missing. Please try again.");
        }
      } catch (error) {
        setNote(
          error instanceof Error
            ? error.message
            : "Unable to start payment. Please try again."
        );
      }
    },
    onError: (err) => {
      setNote(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNote(null);

    if (nights <= 0) {
      setNote("Please pick valid check-in and check-out dates.");
      return;
    }

    if (guests > maxGuests) {
      setNote(`Max guests for this listing is ${maxGuests}.`);
      return;
    }

    bookMutation.mutate({
      roomId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      totalCents,
      cleaningFeeCents: cleaningFeeCents ?? 0,
      taxCents: 0,
      currency: currency ?? "ZAR",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600">Book stay</p>
          <p className="text-lg font-semibold text-gray-900">
            {currency} {(nightlyRateCents / 100).toFixed(2)} / night
          </p>
        </div>
        <div className="text-sm text-gray-600">
          Cleaning: {currency} {((cleaningFeeCents ?? 0) / 100).toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Check-in
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Check-out
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Guests (max {maxGuests})
          <input
            type="number"
            min={1}
            max={maxGuests}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value || "1", 10))}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <div className="flex flex-col justify-end text-sm text-gray-700">
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
            <span className="font-medium">Estimated total</span>
            <span className="font-semibold text-blue-700">
              {currency} {(totalCents / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={bookMutation.isPending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-blue-200"
      >
        {bookMutation.isPending ? "Submitting..." : "Request booking"}
      </button>

      {note && <p className="text-sm text-blue-700">{note}</p>}
    </form>
  );
}
