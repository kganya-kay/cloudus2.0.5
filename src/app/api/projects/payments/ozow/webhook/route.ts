import { PaymentStatus } from "@prisma/client";
import crypto from "crypto";
import { NextResponse } from "next/server";

import { db } from "~/server/db";
import { env } from "~/env";

const buildHash = (params: Record<string, string>, privateKey: string) => {
  const orderedKeys = Object.keys(params).sort((a, b) => a.localeCompare(b));
  const concatenated = orderedKeys.map((k) => params[k] ?? "").join("").toUpperCase();
  const stringToHash = (concatenated + privateKey).trim();
  return crypto.createHash("sha512").update(stringToHash, "utf8").digest("hex");
};

export async function POST(req: Request) {
  if (!env.OZOW_PRIVATE_KEY) {
    return NextResponse.json({ error: "Ozow not configured" }, { status: 501 });
  }

  const payload = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Expected Ozow notify fields (common set; adjust if your account differs)
  const expectedFields = [
    "Amount",
    "CurrencyCode",
    "CountryCode",
    "TransactionReference",
    "BankReference",
    "Status",
    "IsTest",
    "HashCheck",
  ] as const;

  const data: Record<string, string> = {};
  for (const key of expectedFields) {
    const val = payload[key] as string | undefined;
    if (val) data[key] = val;
  }

  const incomingHash = (payload["HashCheck"] as string | undefined)?.toLowerCase() ?? "";
  const hashToVerify = buildHash(
    {
      Amount: data.Amount ?? "",
      BankReference: data.BankReference ?? "",
      CancelUrl: (payload["CancelUrl"] as string) ?? "",
      CountryCode: data.CountryCode ?? "",
      CurrencyCode: data.CurrencyCode ?? "",
      ErrorUrl: (payload["ErrorUrl"] as string) ?? "",
      IsTest: data.IsTest ?? "",
      NotifyUrl: (payload["NotifyUrl"] as string) ?? "",
      SuccessUrl: (payload["SuccessUrl"] as string) ?? "",
      TransactionReference: data.TransactionReference ?? "",
      SiteCode: (payload["SiteCode"] as string) ?? "",
    },
    env.OZOW_PRIVATE_KEY,
  ).toLowerCase();

  if (!incomingHash || incomingHash !== hashToVerify) {
    return NextResponse.json({ error: "Hash verification failed" }, { status: 400 });
  }

  const reference = data.TransactionReference;
  if (!reference) {
    return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 });
  }

  const isPaid = (data.Status ?? "").toUpperCase() === "COMPLETE";
  await db.projectPayment.updateMany({
    where: { id: reference },
    data: {
      status: isPaid ? PaymentStatus.PAID : PaymentStatus.FAILED,
      provider: "OZOW",
      providerRef: reference,
      receiptUrl: null,
    },
  });

  return NextResponse.json({ ok: true });
}
