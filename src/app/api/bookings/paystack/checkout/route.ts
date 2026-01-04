import { BookingStatus, PaymentStatus } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { initializePaystackPayment } from "~/lib/paystack";
import { db } from "~/server/db";
import { env } from "~/env";

const bodySchema = z.object({
  bookingId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const defaultOrigin = () => env.AUTH_URL ?? "http://localhost:3000";

const fallbackEmail = (bookingId: string) =>
  `booking-${bookingId}@paystack.local`;

export async function POST(request: Request) {
  const json = (await request.json().catch(() => null)) as unknown;
  if (!json) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { bookingId, successUrl, cancelUrl } = parsed.data;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      roomId: true,
      guestId: true,
      hostId: true,
      totalCents: true,
      currency: true,
      status: true,
      room: { select: { title: true } },
      guest: { select: { email: true, name: true } },
      payment: { select: { id: true, status: true, providerRef: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === BookingStatus.CANCELED) {
    return NextResponse.json(
      { error: "Booking is canceled" },
      { status: 409 }
    );
  }

  if (booking.payment?.status === PaymentStatus.PAID) {
    return NextResponse.json(
      { error: "Booking already paid" },
      { status: 409 }
    );
  }

  const payment =
    booking.payment ??
    (await db.bookingPayment.create({
      data: {
        bookingId: booking.id,
        amountCents: booking.totalCents,
        currency: booking.currency,
        status: PaymentStatus.PENDING,
        provider: "PAYSTACK",
      },
      select: { id: true },
    }));

  const headerStore = await headers();
  const origin =
    successUrl !== undefined
      ? null
      : headerStore.get("origin") ??
        headerStore.get("referer") ??
        defaultOrigin();

  const resolvedSuccessUrl =
    successUrl ?? `${origin}/rooms/${booking.roomId}?payment=success`;
  const resolvedCancelUrl =
    cancelUrl ?? `${origin}/rooms/${booking.roomId}?payment=cancelled`;

  const description = `Stay: ${booking.room?.title ?? "Room booking"}`;
  const productName = `Booking ${booking.id}`;

  try {
    const initResult = await initializePaystackPayment({
      amountCents: booking.totalCents,
      email: booking.guest?.email ?? fallbackEmail(booking.id),
      currency: booking.currency,
      reference: `book-${booking.id}-${payment.id}`,
      callbackUrl: resolvedSuccessUrl,
      metadata: {
        bookingPaymentId: payment.id,
        bookingId: booking.id,
        cancelUrl: resolvedCancelUrl,
        description,
        name: productName,
      },
    });

    await db.bookingPayment.update({
      where: { id: payment.id },
      data: { providerRef: initResult.reference },
    });

    return NextResponse.json(
      { checkoutUrl: initResult.authorizationUrl, reference: initResult.reference },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to start Paystack checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
