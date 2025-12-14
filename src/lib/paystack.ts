import crypto from "crypto";

import { env } from "~/env";

const PAYSTACK_API_BASE = env.PAYSTACK_API_URL ?? "https://api.paystack.co";

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status?: string;
    reference?: string;
    gateway_response?: string;
    metadata?: Record<string, unknown>;
    receipt_number?: string | null;
    authorization?: { authorization_code?: string | null } | null;
  };
};

async function paystackRequest<T>(path: string, body: unknown) {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new Error("Missing PAYSTACK_SECRET_KEY – set it in your environment.");
  }

  const response = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => null)) as T | null;

  if (!response.ok || !json) {
    const message =
      (json as { message?: string } | null)?.message ??
      `Paystack request to ${path} failed with status ${response.status}`;
    throw new Error(message);
  }

  return json;
}

export async function initializePaystackPayment(params: {
  amountCents: number;
  email: string;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    amount: params.amountCents,
    email: params.email,
    currency: params.currency?.toUpperCase() ?? "ZAR",
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata ?? {},
  };

  const json = await paystackRequest<PaystackInitResponse>(
    "/transaction/initialize",
    payload,
  );

  if (!json.status || !json.data?.authorization_url || !json.data.reference) {
    throw new Error(json.message || "Failed to initialize Paystack transaction.");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    reference: json.data.reference,
    accessCode: json.data.access_code,
  };
}

export async function verifyPaystackTransaction(reference: string) {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new Error("Missing PAYSTACK_SECRET_KEY – set it in your environment.");
  }

  const response = await fetch(`${PAYSTACK_API_BASE}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    },
  });

  const json = (await response.json().catch(() => null)) as PaystackVerifyResponse | null;

  if (!response.ok || !json?.status) {
    const message = json?.message ?? `Paystack verify failed with status ${response.status}`;
    throw new Error(message);
  }

  return {
    status: json.data?.status,
    reference: json.data?.reference ?? reference,
    receiptNumber: json.data?.receipt_number ?? undefined,
    gatewayResponse: json.data?.gateway_response,
    metadata: json.data?.metadata,
  };
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature || !env.PAYSTACK_SECRET_KEY) return false;
  const hash = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
