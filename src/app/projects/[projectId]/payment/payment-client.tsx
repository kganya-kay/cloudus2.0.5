"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@mui/material";

type PaymentRecord = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  provider: string;
  providerRef: string | null;
  receiptUrl: string | null;
  purpose: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ProjectInfo = {
  id: number;
  name: string;
  price: number;
  status: string;
  createdAt: string | Date;
};

const money = (value?: number, currency = "ZAR") => {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value / 100);
  } catch {
    return `R ${(value / 100).toFixed(0)}`;
  }
};

const formatDate = (value: string | Date) => {
  try {
    const date = typeof value === "string" ? new Date(value) : value;
    return new Intl.DateTimeFormat("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return typeof value === "string" ? value : value.toISOString();
  }
};

export function ProjectPaymentClient({
  project,
  pendingPayment,
  payments,
  paidCents,
  highlightPaymentId,
}: {
  project: ProjectInfo;
  pendingPayment: PaymentRecord | null;
  payments: PaymentRecord[];
  paidCents: number;
  highlightPaymentId?: string;
}) {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayCurrency = useMemo(
    () => pendingPayment?.currency ?? payments[0]?.currency ?? "ZAR",
    [pendingPayment?.currency, payments],
  );
  const remainingCents = useMemo(() => Math.max(project.price - paidCents, 0), [project.price, paidCents]);

  const handleCheckout = async () => {
    if (!pendingPayment) return;
    try {
      setCheckoutError(null);
      setLoading(true);
      const response = await fetch("/api/projects/payments/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: pendingPayment.id }),
      });
      const data = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
      if (!response.ok || !data?.checkoutUrl) {
        throw new Error(data?.error ?? "Unable to start payment. Please try again.");
      }
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to launch checkout.");
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Project budget</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {money(project.price, displayCurrency)}
          </p>
          <p className="text-xs text-gray-500">Status: {project.status}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase text-emerald-700">Paid to date</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">
            {money(paidCents, displayCurrency)}
          </p>
          <p className="text-xs text-emerald-800">Receipts recorded inside this workspace.</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase text-blue-700">Outstanding</p>
          <p className="mt-2 text-2xl font-semibold text-blue-900">
            {money(remainingCents, displayCurrency)}
          </p>
          <p className="text-xs text-blue-900">Deposit and milestone payouts reduce this over time.</p>
        </div>
      </div>

      {pendingPayment ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase text-amber-700">Deposit required</p>
          <p className="mt-1 text-lg font-semibold text-amber-900">
            {money(pendingPayment.amountCents, pendingPayment.currency)}
          </p>
          <p className="text-sm text-amber-900">
            Pay this deposit to activate tasks, supplier sourcing, and driver dispatching.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={handleCheckout}
              disabled={loading}
              variant="contained"
              className="!rounded-full !bg-amber-600 hover:!bg-amber-700"
            >
              {loading ? "Launching checkout..." : "Pay with Stripe"}
            </Button>
            <Button
              component={Link}
              href={`/projects/${project.id}`}
              variant="text"
              className="!rounded-full !text-amber-900"
            >
              Back to project
            </Button>
          </div>
          {checkoutError && <p className="mt-2 text-sm text-red-600">{checkoutError}</p>}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          All deposits have been received. Track additional payouts from the project dashboard.
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Payment history</p>
            <p className="text-xs text-gray-500">Deposits and milestone releases appear here.</p>
          </div>
          <Button component={Link} href={`/projects/${project.id}`} variant="outlined" className="!rounded-full">
            View project
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Purpose</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Updated</th>
                <th className="px-4 py-2">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-gray-500">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className={highlightPaymentId === payment.id ? "bg-blue-50/60" : undefined}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{payment.id}</td>
                    <td className="px-4 py-3 text-gray-800">{payment.purpose}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {money(payment.amountCents, payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          payment.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : payment.status === "FAILED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(payment.updatedAt)}</td>
                    <td className="px-4 py-3 text-xs">
                      {payment.receiptUrl ? (
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
