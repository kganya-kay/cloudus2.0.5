"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@mui/material";

import { api } from "~/trpc/react";

type PaymentRecord = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  provider: string;
  providerRef: string | null;
  receiptUrl: string | null;
  purpose: string;
  label?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  dueAt?: string | Date | null;
};

type ProjectInfo = {
  id: number;
  name: string;
  price: number;
  status: string;
  createdAt: string | Date;
};

type PaymentPreference = {
  id: string;
  autopayEnabled: boolean;
  autopayThresholdPercent: number;
  tipPercent: number;
  tipJarCents: number;
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
  preferences,
  highlightPaymentId,
}: {
  project: ProjectInfo;
  pendingPayment: PaymentRecord | null;
  payments: PaymentRecord[];
  paidCents: number;
  preferences: PaymentPreference;
  highlightPaymentId?: string;
}) {
  const utils = api.useUtils();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autopayEnabled, setAutopayEnabled] = useState(preferences.autopayEnabled);
  const [autopayThreshold, setAutopayThreshold] = useState(
    preferences.autopayThresholdPercent ?? 100,
  );
  const [tipAmount, setTipAmount] = useState("250");
  const [tipMessage, setTipMessage] = useState("");
  const [tipJarCents, setTipJarCents] = useState(preferences.tipJarCents ?? 0);

  const displayCurrency = useMemo(
    () => pendingPayment?.currency ?? payments[0]?.currency ?? "ZAR",
    [pendingPayment?.currency, payments],
  );
  const remainingCents = useMemo(() => Math.max(project.price - paidCents, 0), [project.price, paidCents]);
  const milestones = useMemo(() => {
    return [...payments]
      .sort((a, b) => {
        const aDue = a.dueAt ? new Date(a.dueAt).getTime() : new Date(a.createdAt).getTime();
        const bDue = b.dueAt ? new Date(b.dueAt).getTime() : new Date(b.createdAt).getTime();
        return aDue - bDue;
      })
      .map((payment) => ({
        ...payment,
        dueDate: payment.dueAt ? formatDate(payment.dueAt) : formatDate(payment.createdAt),
      }));
  }, [payments]);

  const updatePreferences = api.project.updatePaymentPreferences.useMutation({
    onSuccess: (next) => {
      setAutopayEnabled(next.autopayEnabled);
      setAutopayThreshold(next.autopayThresholdPercent);
    },
  });

  const createTipPayment = api.project.createTipPayment.useMutation();
  const handleAutopayToggle = () => {
    updatePreferences.mutate({ projectId: project.id, autopayEnabled: !autopayEnabled });
  };
  const handleAutopayThresholdSave = () => {
    updatePreferences.mutate({
      projectId: project.id,
      autopayThresholdPercent: autopayThreshold,
    });
  };
  const handleTipSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const amountValue = Number(tipAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setCheckoutError("Enter a valid tip amount.");
      return;
    }
    try {
      const cents = Math.round(amountValue * 100);
      const result = await createTipPayment.mutateAsync({
        projectId: project.id,
          amountCents: cents,
          message: tipMessage || undefined,
        });
      setTipAmount("250");
      setTipMessage("");
      setTipJarCents((value) => value + cents);
      await launchCheckout(result.paymentId);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to start tip checkout.");
      setLoading(false);
    }
  };

  const launchCheckout = async (paymentId: string) => {
    try {
      setCheckoutError(null);
      setLoading(true);
      const response = await fetch("/api/projects/payments/paystack/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
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

  const launchOzowCheckout = async (paymentId: string) => {
    try {
      setCheckoutError(null);
      setLoading(true);
      const response = await fetch("/api/projects/payments/ozow/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;
      if (!response.ok || !data?.checkoutUrl) {
        throw new Error(data?.error ?? "Unable to start Ozow checkout.");
      }
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to launch Ozow checkout.");
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!pendingPayment) return;
    await launchCheckout(pendingPayment.id);
  };

  const handleOzowCheckout = async () => {
    if (!pendingPayment) return;
    await launchOzowCheckout(pendingPayment.id);
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

      <div className="rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Milestone schedule</p>
            <p className="text-xs text-gray-500">
              Deposits, production payouts, and success tips in one view.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">{milestones.length} entries</span>
        </div>
        <ol className="mt-4 space-y-3 text-sm text-gray-700">
          {milestones.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-500">
              No payments scheduled yet.
            </li>
          ) : (
            milestones.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3"
              >
                <div>
                  <p className="text-xs uppercase text-gray-500">{payment.label ?? payment.purpose}</p>
                  <p className="font-semibold text-gray-900">{payment.dueDate}</p>
                  <p className="text-xs text-gray-500">{payment.purpose}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {money(payment.amountCents, payment.currency)}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      payment.status === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : payment.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {payment.status.toLowerCase()}
                  </span>
                </div>
              </li>
            ))
          )}
        </ol>
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
              {loading ? "Launching checkout..." : "Pay with Paystack"}
            </Button>
            <Button
              onClick={handleOzowCheckout}
              disabled={loading}
              variant="outlined"
              className="!rounded-full"
            >
              {loading ? "Launching..." : "Pay with Ozow"}
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

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-600">Autopay</p>
            <p className="text-sm text-gray-700">
              Automatically release milestones once {autopayThreshold}% of deliverables are approved.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutopayToggle}
            className={`rounded-full px-4 py-1 text-xs font-semibold ${
              autopayEnabled ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
            disabled={updatePreferences.isPending}
          >
            {autopayEnabled ? "Autopay on" : "Autopay off"}
          </button>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase text-gray-500">
            Release threshold ({autopayThreshold}%)
          </label>
          <input
            type="range"
            min={10}
            max={100}
            value={autopayThreshold}
            onChange={(event) => setAutopayThreshold(Number(event.target.value))}
            className="mt-2 w-full"
          />
          <div className="mt-3 flex justify-end">
            <Button
              onClick={handleAutopayThresholdSave}
              disabled={updatePreferences.isPending}
              variant="outlined"
              className="!rounded-full"
            >
              Save threshold
            </Button>
          </div>
        </div>
        {updatePreferences.isPending && (
          <p className="mt-2 text-xs text-gray-500">Updating payment settings...</p>
        )}
      </div>

      <form
        onSubmit={handleTipSubmit}
        className="rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-inner"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-700">Tip creators</p>
            <p className="text-sm text-gray-600">
              Say thanks to collaborators with an instant bonus. Tip jar total:{" "}
              {money(tipJarCents, displayCurrency)}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr,1fr,auto]">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500">Amount (ZAR)</label>
            <input
              type="number"
              min={50}
              value={tipAmount}
              onChange={(event) => setTipAmount(event.target.value)}
              className="mt-1 w-full rounded-full border px-4 py-2 text-sm"
              placeholder="250"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-gray-500">Note</label>
            <input
              type="text"
              value={tipMessage}
              onChange={(event) => setTipMessage(event.target.value)}
              className="mt-1 w-full rounded-full border px-4 py-2 text-sm"
              placeholder="Thank you for the sprint!"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={createTipPayment.isPending}
              variant="contained"
              className="!rounded-full !bg-emerald-600 text-white"
            >
              {createTipPayment.isPending ? "Starting checkout..." : "Tip & pay"}
            </Button>
          </div>
        </div>
      </form>

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
