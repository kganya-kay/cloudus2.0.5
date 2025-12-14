import { PaymentStatus } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { initializePaystackPayment } from "~/lib/paystack";
import { db } from "~/server/db";
import { env } from "~/env";

const bodySchema = z.object({
  paymentId: z.string().cuid(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const defaultOrigin = () => env.AUTH_URL ?? "http://localhost:3000";

const fallbackEmail = (projectId: number) => `project-${projectId}@paystack.local`;

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
      provider: true,
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          createdBy: { select: { email: true } },
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
    successUrl ?? `${origin}/projects/${paymentRecord.project.id}/payment`;
  const resolvedCancelUrl =
    cancelUrl ?? `${origin}/projects/${paymentRecord.project.id}/payment?payment=cancelled`;
  const description =
    paymentRecord.project.description?.slice(0, 250) ?? "Project payment";

  try {
    const initResult = await initializePaystackPayment({
      amountCents: paymentRecord.amountCents,
      email: paymentRecord.project.createdBy?.email ?? fallbackEmail(paymentRecord.project.id),
      currency: paymentRecord.currency,
      reference: `project-${paymentRecord.project.id}-${paymentRecord.id}`,
      callbackUrl: resolvedSuccessUrl,
      metadata: {
        projectPaymentId: paymentRecord.id,
        projectId: paymentRecord.project.id,
        purpose: paymentRecord.purpose,
        cancelUrl: resolvedCancelUrl,
        description,
      },
    });

    await db.projectPayment.update({
      where: { id: paymentRecord.id },
      data: {
        provider: "PAYSTACK",
        providerRef: initResult.reference,
      },
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
