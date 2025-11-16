import { PaymentStatus } from "@prisma/client";
import type Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { stripe } from "~/lib/stripe";
import { db } from "~/server/db";
import { env } from "~/env";

const bodySchema = z.object({
  paymentId: z.string().cuid(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const defaultOrigin = () => env.AUTH_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const json = (await request.json().catch(() => null)) as unknown;
  if (!json) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parseResult = bodySchema.safeParse(json);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const { paymentId, successUrl, cancelUrl } = parseResult.data;

  const paymentRecord = await db.projectPayment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      amountCents: true,
      currency: true,
      status: true,
      purpose: true,
      project: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  if (!paymentRecord) {
    return NextResponse.json({ error: "Project payment not found" }, { status: 404 });
  }

  if (paymentRecord.status === PaymentStatus.PAID) {
    return NextResponse.json({ error: "Payment already settled" }, { status: 409 });
  }

  if (paymentRecord.amountCents <= 0) {
    return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
  }

  const headerStore = await headers();
  const origin =
    successUrl !== undefined
      ? null
      : headerStore.get("origin") ?? headerStore.get("referer") ?? defaultOrigin();
  const resolvedSuccessUrl =
    successUrl ??
    `${origin}/projects/${paymentRecord.project.id}/payment?session_id={CHECKOUT_SESSION_ID}`;
  const resolvedCancelUrl =
    cancelUrl ?? `${origin}/projects/${paymentRecord.project.id}/payment?payment=cancelled`;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: paymentRecord.currency.toLowerCase(),
        unit_amount: paymentRecord.amountCents,
        product_data: {
          name: `${paymentRecord.project.name} — ${paymentRecord.purpose ?? "Payment"}`,
          description: paymentRecord.project.description.slice(0, 250),
        },
      },
    },
  ];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: `project-${paymentRecord.project.id}`,
    line_items: lineItems,
    success_url: resolvedSuccessUrl,
    cancel_url: resolvedCancelUrl,
    metadata: {
      projectPaymentId: paymentRecord.id,
      projectId: paymentRecord.project.id.toString(),
    },
    payment_intent_data: {
      metadata: {
        projectPaymentId: paymentRecord.id,
        projectId: paymentRecord.project.id.toString(),
      },
    },
    automatic_tax: { enabled: false },
    currency: paymentRecord.currency.toLowerCase(),
  });

  await db.projectPayment.update({
    where: { id: paymentRecord.id },
    data: { providerRef: session.id },
  });

  return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id }, { status: 201 });
}
