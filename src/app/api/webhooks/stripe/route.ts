import { PaymentStatus } from "@prisma/client";
import type Stripe from "stripe";
import { NextResponse } from "next/server";

import { stripe } from "~/lib/stripe";
import { env } from "~/env";
import { db } from "~/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const relevantEvents = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
]);

const successEvents = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "payment_intent.succeeded",
]);

const failureEvents = new Set<Stripe.Event.Type>([
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
]);

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

export async function POST(request: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown webhook error";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (!relevantEvents.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const dataObject = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
  const metadata = (dataObject.metadata ?? {}) as Stripe.Metadata;
  const paymentId = metadata.paymentId;
  const projectPaymentId = metadata.projectPaymentId;

  if (!paymentId && !projectPaymentId) {
    console.warn(`Stripe webhook ${event.id} missing payment references.`);
    return NextResponse.json({ received: true });
  }

  const providerRef =
    "payment_intent" in dataObject
      ? typeof dataObject.payment_intent === "string"
        ? dataObject.payment_intent
        : dataObject.payment_intent?.id
      : "id" in dataObject
        ? dataObject.id
        : undefined;

  const receiptUrl =
    "latest_charge" in dataObject && dataObject.latest_charge && typeof dataObject.latest_charge !== "string"
      ? dataObject.latest_charge.receipt_url ?? undefined
      : undefined;

  if (successEvents.has(event.type)) {
    if (paymentId) {
      await updatePaymentStatus({
        paymentId,
        status: PaymentStatus.PAID,
        providerRef,
        receiptUrl,
      });
    }
    if (projectPaymentId) {
      await updateProjectPaymentStatus({
        paymentId: projectPaymentId,
        status: PaymentStatus.PAID,
        providerRef,
        receiptUrl,
      });
    }
  } else if (failureEvents.has(event.type)) {
    if (paymentId) {
      await updatePaymentStatus({
        paymentId,
        status: PaymentStatus.FAILED,
        providerRef,
        receiptUrl,
      });
    }
    if (projectPaymentId) {
      await updateProjectPaymentStatus({
        paymentId: projectPaymentId,
        status: PaymentStatus.FAILED,
        providerRef,
        receiptUrl,
      });
    }
  }

  return NextResponse.json({ received: true });
}
