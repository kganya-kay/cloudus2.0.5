import { PaymentStatus } from "@prisma/client";
import type Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { stripe } from "~/lib/stripe";
import { db } from "~/server/db";
import { env } from "~/env";

const bodySchema = z.object({
  orderId: z.number().int().positive(),
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
      { status: 400 }
    );
  }

  const { orderId, successUrl, cancelUrl } = parseResult.data;

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      price: true,
      deliveryCents: true,
      currency: true,
      name: true,
      description: true,
      customerEmail: true,
      payments: {
        select: { id: true, status: true, provider: true, providerRef: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const totalCents = order.price + order.deliveryCents;
  if (totalCents <= 0) {
    return NextResponse.json({ error: "Order total must be greater than zero" }, { status: 400 });
  }

  const hasPaidPayment = order.payments.some(
    (payment) => payment.provider === "STRIPE" && payment.status === PaymentStatus.PAID
  );
  if (hasPaidPayment) {
    return NextResponse.json({ error: "Order already settled via Stripe" }, { status: 409 });
  }

  const existingPending = order.payments.find(
    (payment) => payment.provider === "STRIPE" && payment.status === PaymentStatus.PENDING
  );

  const payment =
    existingPending ??
    (await db.payment.create({
      data: {
        orderId: order.id,
        amountCents: totalCents,
        provider: "STRIPE",
        status: PaymentStatus.PENDING,
      },
      select: { id: true },
    }));

  const headerStore = await headers();
  const origin =
    successUrl !== undefined
      ? null
      : headerStore.get("origin") ?? headerStore.get("referer") ?? defaultOrigin();
  const resolvedSuccessUrl =
    successUrl ??
    `${origin}/shop/orders/${order.id}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
  const resolvedCancelUrl =
    cancelUrl ?? `${origin}/shop/orders/${order.id}?payment=cancelled`;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: order.currency.toLowerCase(),
        unit_amount: order.price,
        product_data: {
          name: order.name,
          description: order.description.slice(0, 250),
        },
      },
    },
  ];

  if (order.deliveryCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: order.currency.toLowerCase(),
        unit_amount: order.deliveryCents,
        product_data: {
          name: "Delivery",
          description: "Delivery and logistics",
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: order.id.toString(),
    customer_email: order.customerEmail ?? undefined,
    line_items: lineItems,
    success_url: resolvedSuccessUrl,
    cancel_url: resolvedCancelUrl,
    metadata: {
      orderId: order.id.toString(),
      paymentId: payment.id,
    },
    payment_intent_data: {
      metadata: {
        orderId: order.id.toString(),
        paymentId: payment.id,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: "required",
    automatic_tax: { enabled: false },
    currency: order.currency.toLowerCase(),
  });

  await db.payment.update({
    where: { id: payment.id },
    data: { providerRef: session.id },
  });

  return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id }, { status: 201 });
}
