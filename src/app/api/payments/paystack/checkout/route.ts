import { PaymentStatus } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { initializePaystackPayment } from "~/lib/paystack";
import { db } from "~/server/db";
import { env } from "~/env";

const bodySchema = z.object({
  orderId: z.number().int().positive(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const defaultOrigin = () => env.AUTH_URL ?? "http://localhost:3000";

const fallbackEmail = (orderId: number) => `kganyakekana+order-${orderId}@gmail.com`;

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
      api: true,
      link: true,
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
    (payment) => payment.provider === "PAYSTACK" && payment.status === PaymentStatus.PAID,
  );
  if (hasPaidPayment) {
    return NextResponse.json({ error: "Order already settled via Paystack" }, { status: 409 });
  }

  const existingPending = order.payments.find(
    (payment) => payment.provider === "PAYSTACK" && payment.status === PaymentStatus.PENDING,
  );

  const payment =
    existingPending ??
    (await db.payment.create({
      data: {
        orderId: order.id,
        amountCents: totalCents,
        provider: "PAYSTACK",
        status: PaymentStatus.PENDING,
      },
      select: { id: true },
    }));

  const headerStore = await headers();
  const origin =
    successUrl !== undefined
      ? null
      : headerStore.get("origin") ?? headerStore.get("referer") ?? defaultOrigin();

  const isLaundry = order.api === "laundry" || order.link === "laundry";

  const resolvedSuccessUrl =
    successUrl ??
    (isLaundry
      ? `${origin}/laundry/payment/success`
      : `${origin}/shop/orders/${order.id}/payment/success`);
  const resolvedCancelUrl =
    cancelUrl ??
    (isLaundry
      ? `${origin}/laundry?payment=cancelled`
      : `${origin}/shop/orders/${order.id}?payment=cancelled`);
  const description = order.description?.slice(0, 250) ?? "Order payment";
  const productName = order.name || `Order ${order.id}`;

  try {
    const initResult = await initializePaystackPayment({
      amountCents: totalCents,
      email: order.customerEmail ?? fallbackEmail(order.id),
      currency: order.currency,
      reference: `ord-${order.id}-${payment.id}`,
      callbackUrl: resolvedSuccessUrl,
      metadata: {
        orderId: order.id,
        paymentId: payment.id,
        cancelUrl: resolvedCancelUrl,
        description,
        name: productName,
      },
    });

    await db.payment.update({
      where: { id: payment.id },
      data: { providerRef: initResult.reference },
    });

    return NextResponse.json(
      { checkoutUrl: initResult.authorizationUrl, reference: initResult.reference },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start Paystack checkout. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
