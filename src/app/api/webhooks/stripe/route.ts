import { NextResponse } from "next/server";

import { verifyPaystackSignature, verifyPaystackTransaction } from "~/lib/paystack";
import { env } from "~/env";
import { db } from "~/server/db";
import { PaymentStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaystackEvent = {
  event?: string;
  data?: {
    status?: string;
    reference?: string;
    gateway_response?: string;
    receipt_number?: string | null;
    metadata?: Record<string, unknown>;
  };
};

const successStates = new Set(["success"]);
const failureStates = new Set(["failed", "failure", "abandoned", "cancelled", "reversed"]);

async function updatePaymentStatus(params: {
  paymentId: string;
  providerRef?: string | null;
  receiptUrl?: string | null;
  status: PaymentStatus;
}) {
  try {
    await db.payment.update({
      where: { id: params.paymentId },
      data: {
        status: params.status,
        providerRef: params.providerRef ?? undefined,
        receiptUrl: params.receiptUrl ?? undefined,
      },
    });
  } catch (error) {
    console.error(`Failed to update payment ${params.paymentId}`, error);
  }
}

async function updateProjectPaymentStatus(params: {
  paymentId: string;
  providerRef?: string | null;
  receiptUrl?: string | null;
  status: PaymentStatus;
}) {
  try {
    await db.projectPayment.update({
      where: { id: params.paymentId },
      data: {
        status: params.status,
        providerRef: params.providerRef ?? undefined,
        receiptUrl: params.receiptUrl ?? undefined,
      },
    });
  } catch (error) {
    console.error(`Failed to update project payment ${params.paymentId}`, error);
  }
}

async function updateBookingPaymentStatus(params: {
  paymentId: string;
  providerRef?: string | null;
  receiptUrl?: string | null;
  status: PaymentStatus;
}) {
  try {
    const updated = await db.bookingPayment.update({
      where: { id: params.paymentId },
      data: {
        status: params.status,
        providerRef: params.providerRef ?? undefined,
        receiptUrl: params.receiptUrl ?? undefined,
      },
      select: { bookingId: true },
    });

    if (params.status === PaymentStatus.PAID && updated.bookingId) {
      await db.booking.update({
        where: { id: updated.bookingId },
        data: { status: "CONFIRMED" },
      });
    }

    if (params.status === PaymentStatus.FAILED && updated.bookingId) {
      await db.booking.update({
        where: { id: updated.bookingId },
        data: { status: "CANCELED" },
      });
    }
  } catch (error) {
    console.error(`Failed to update booking payment ${params.paymentId}`, error);
  }
}

export async function POST(request: Request) {
  if (!env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { error: "Paystack secret key not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("x-paystack-signature");
  const rawBody = await request.text();

  const signatureValid = verifyPaystackSignature(rawBody, signature);
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid Paystack signature" }, { status: 400 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  if (!event?.data) {
    return NextResponse.json({ received: true });
  }

  const status = (event.data.status ?? "").toLowerCase();
  const providerRef = event.data.reference ?? undefined;
  const metadata = (event.data.metadata ?? {}) as Record<string, unknown>;
  const paymentId = typeof metadata.paymentId === "string" ? metadata.paymentId : undefined;
  const projectPaymentId =
    typeof metadata.projectPaymentId === "string" ? metadata.projectPaymentId : undefined;
  const bookingPaymentId =
    typeof metadata.bookingPaymentId === "string" ? metadata.bookingPaymentId : undefined;

  if (!paymentId && !projectPaymentId && !bookingPaymentId) {
    console.warn(`Paystack webhook ${event.event ?? "unknown"} missing payment references.`);
    return NextResponse.json({ received: true });
  }

  let nextStatus: PaymentStatus | null = null;

  if (successStates.has(status) || event.event === "charge.success") {
    let verifiedStatus = status;
    if (providerRef) {
      try {
        const verification = await verifyPaystackTransaction(providerRef);
        verifiedStatus = (verification.status ?? status)?.toLowerCase();
      } catch (error) {
        console.error(`Paystack verify failed for ${providerRef}`, error);
      }
    }
    if (successStates.has(verifiedStatus)) {
      nextStatus = PaymentStatus.PAID;
    }
  } else if (failureStates.has(status) || event.event?.includes("failed")) {
    nextStatus = PaymentStatus.FAILED;
  }

  if (!nextStatus) {
    return NextResponse.json({ received: true });
  }

  const receiptUrl = event.data.receipt_number
    ? `paystack-receipt:${event.data.receipt_number}`
    : null;

  if (paymentId) {
    await updatePaymentStatus({
      paymentId,
      status: nextStatus,
      providerRef,
      receiptUrl,
    });
  }

  if (projectPaymentId) {
    await updateProjectPaymentStatus({
      paymentId: projectPaymentId,
      status: nextStatus,
      providerRef,
      receiptUrl,
    });
  }

  if (bookingPaymentId) {
    await updateBookingPaymentStatus({
      paymentId: bookingPaymentId,
      status: nextStatus,
      providerRef,
      receiptUrl,
    });
  }

  return NextResponse.json({ received: true });
}
