import { PaymentStatus } from "@prisma/client";
import crypto from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "~/server/db";
import { env } from "~/env";

const bodySchema = z.object({
  paymentId: z.string().cuid(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const defaultOrigin = () => env.AUTH_URL ?? "http://localhost:3000";
const resolveOzowUrl = () => env.OZOW_API_URL ?? "https://pay.ozow.com";

const buildHash = (params: Record<string, string>, privateKey: string) => {
  // Ozow typically requires concatenation of values (sorted by key, empty strings included),
  // uppercase the result, append the private key, then SHA512 hex lower-case.
  const orderedKeys = Object.keys(params).sort((a, b) => a.localeCompare(b));
  const concatenated = orderedKeys.map((k) => params[k] ?? "").join("").toUpperCase();
  const stringToHash = (concatenated + privateKey).trim();
  return crypto.createHash("sha512").update(stringToHash, "utf8").digest("hex");
};

export async function POST(request: Request) {
  const json = (await request.json().catch(() => null)) as unknown;
  if (!json) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!env.OZOW_SITE_CODE || !env.OZOW_PRIVATE_KEY) {
    return NextResponse.json(
      { error: "Ozow is not configured. Set OZOW_SITE_CODE and OZOW_PRIVATE_KEY." },
      { status: 501 },
    );
  }

  const { paymentId, successUrl, cancelUrl } = parsed.data;

  const paymentRecord = await db.projectPayment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      amountCents: true,
      currency: true,
      status: true,
      purpose: true,
      project: { select: { id: true, name: true, description: true } },
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
    successUrl ?? `${origin}/projects/${paymentRecord.project.id}/payment?provider=ozow&success=1`;
  const resolvedCancelUrl =
    cancelUrl ?? `${origin}/projects/${paymentRecord.project.id}/payment?provider=ozow&cancelled=1`;

  // Build Ozow params (hosted payment). Field names follow Ozow conventions.
  const ozowParams: Record<string, string> = {
    Amount: (paymentRecord.amountCents / 100).toFixed(2),
    CurrencyCode: paymentRecord.currency.toUpperCase(),
    CountryCode: "ZA",
    TransactionReference: paymentRecord.id,
    BankReference: paymentRecord.project.name.slice(0, 20),
    CancelUrl: resolvedCancelUrl,
    ErrorUrl: resolvedCancelUrl,
    SuccessUrl: resolvedSuccessUrl,
    NotifyUrl: `${defaultOrigin()}/api/projects/payments/ozow/webhook`,
    IsTest: env.OZOW_MODE === "live" ? "false" : "true",
    SiteCode: env.OZOW_SITE_CODE,
  };
  const hashCheck = buildHash(ozowParams, env.OZOW_PRIVATE_KEY);
  const params = new URLSearchParams({ ...ozowParams, HashCheck: hashCheck });

  const checkoutUrl = `${resolveOzowUrl()}?${params.toString()}`;

  await db.projectPayment.update({
    where: { id: paymentRecord.id },
    data: { provider: "OZOW", providerRef: paymentRecord.id },
  });

  return NextResponse.json({ checkoutUrl }, { status: 201 });
}
