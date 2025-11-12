// src/app/admin/orders/[id]/view-client.tsx
"use client";

import type { FulfilmentStatus } from "@prisma/client";
import { useMemo, useState } from "react";
import { UploadButton } from "~/utils/uploadthing";
import { type RouterOutputs, api } from "~/trpc/react";
// api imported above with RouterOutputs
import { SpeedButtons } from "../../_components/SpeedButtons";
import { StatusBadge } from "../../_components/StatusBadge";

// Minimal shape we actually render (aligns with your order.getById select)
type OrderDetail = {
  id: number;
  name: string | null;
  description: string | null;
  code: string;
  status: FulfilmentStatus;
  price: number | null;
  deliveryCents: number | null;
  currency: string | null;
  link: string | null;
  api: string | null;
  links: string[] | null;
  image: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  addressLine1: string | null;
  suburb: string | null;
  city: string | null;
  estimatedKg: number | null;
  createdAt: string | Date;
  caretakerId: string | null;
  supplierId: string | null;
  supplier: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    suburb: string | null;
    city: string | null;
    pricePerKg: number | null;
    isActive: boolean;
  } | null;
  payouts: { id: string; amountCents: number; status: string }[];
  payments: { id: string; amountCents: number; status: string; provider: string; providerRef: string | null; receiptUrl: string | null; createdAt: string | Date }[];
  auditLogs: { id: string; action: string; payload: unknown; createdAt: string | Date }[];
};

const STATUSES: readonly FulfilmentStatus[] = [
  "SOURCING_SUPPLIER",
  "SUPPLIER_CONFIRMED",
  "IN_PROGRESS",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CLOSED",
];

const prettyJson = (v: unknown) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

export default function Client({ id }: { id: number }) {
  const { data, isLoading } = api.order.getById.useQuery({ orderId: id });
  const order = data as OrderDetail | undefined;

  const utils = api.useUtils();
  const changeStatus = api.order.changeStatus.useMutation({
    onSuccess: async () => {
      await utils.order.getById.invalidate({ orderId: id });
    },
  });
  const update = api.order.update.useMutation({
    onSuccess: async () => {
      await utils.order.getById.invalidate({ orderId: id });
    },
  });
  const addPayment = api.order.addPayment.useMutation({
    onSuccess: async () => {
      await utils.order.getById.invalidate({ orderId: id });
      setPayAmount(""); setPayProvider("CASH"); setPayRef("");
    },
  });
  const setPaymentStatus = api.order.setPaymentStatus.useMutation({
    onSuccess: async () => {
      await utils.order.getById.invalidate({ orderId: id });
    },
  });
  const triggerPayout = api.order.triggerPayout.useMutation({
    onSuccess: async () => {
      await utils.order.getById.invalidate({ orderId: id });
      setPayoutRands("");
    },
  });
  const setPayoutStatus = api.order.setPayoutStatus.useMutation({
    onSuccess: async () => {
      await utils.order.getById.invalidate({ orderId: id });
    },
  });
  const [priceRands, setPriceRands] = useState("");
  const [deliveryRands, setDeliveryRands] = useState("");
  const [currency, setCurrency] = useState("ZAR");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [link, setLink] = useState("");
  const [apiField, setApiField] = useState("");
  const [linksText, setLinksText] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [estimatedKg, setEstimatedKg] = useState("");
  const [supplierQuery, setSupplierQuery] = useState("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [caretakerQuery, setCaretakerQuery] = useState("");
  const [caretakerId, setCaretakerId] = useState<string>("");
  // payments
  const [payAmount, setPayAmount] = useState(""); // rands
  const [payProvider, setPayProvider] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  // payouts
  const [payoutRands, setPayoutRands] = useState("");

  const { data: suppliers } = api.supplier.list.useQuery({ q: supplierQuery || undefined, onlyActive: true, page: 1, pageSize: 50 });
  type SupplierRow = NonNullable<typeof suppliers>["items"][number];
  type UserRow = NonNullable<RouterOutputs["user"]["getAll"]>[number];
  const { data: users } = api.user.getAll.useQuery();
  const caretakers: UserRow[] = (users ?? []).filter((u) => u.role === "CARETAKER");

  useMemo(() => {
    if (!order) return;
    setPriceRands(String(Math.round((order.price ?? 0) / 100)));
    setDeliveryRands(String(Math.round((order.deliveryCents ?? 0) / 100)));
    setCurrency(order.currency ?? "ZAR");
    setName(order.name ?? "");
    setDescription(order.description ?? "");
    setCustomerName(order.customerName ?? "");
    setCustomerPhone(order.customerPhone ?? "");
    setCustomerEmail(order.customerEmail ?? "");
    setAddressLine1(order.addressLine1 ?? "");
    setSuburb(order.suburb ?? "");
    setCity(order.city ?? "");
    setLink(order.link ?? "");
    setApiField(order.api ?? "");
    setLinksText(Array.isArray(order.links) ? order.links.join("\n") : "");
    setImage(order.image ?? undefined);
    setEstimatedKg(order.estimatedKg != null ? String(order.estimatedKg) : "");
    setSupplierId(order.supplierId ?? "");
    setCaretakerId(order.caretakerId ?? "");
  }, [order]);
  function getUploadedUrl(files: unknown): string | undefined {
    if (!Array.isArray(files) || files.length === 0) return undefined;
    const f = files[0] as Record<string, unknown>;
    const pick = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v : undefined);

    const urlStr = pick(f.url);
    const ufsUrl = pick((f as { ufsUrl?: unknown }).ufsUrl);
    const serverUrl = pick((f.serverData as Record<string, unknown> | undefined)?.url);
    const keyStr = pick((f as { key?: unknown }).key);

    return urlStr ?? ufsUrl ?? serverUrl ?? (keyStr ? `https://utfs.io/f/${keyStr}` : undefined);
  }

  if (isLoading || !order) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order {order.code}</h1>
          <p className="text-sm text-gray-500">{order.customerName ?? "—"}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <SpeedButtons
        code={order.code}
        customerPhone={order.customerPhone ?? undefined}
        customerEmail={order.customerEmail ?? undefined}
        supplierPhone={order.supplier?.phone ?? undefined}
      />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border p-3">
          <h2 className="mb-2 text-sm font-semibold">Edit Details</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate({
                orderId: id,
                name: name || undefined,
                description: description || undefined,
                priceCents: Math.round((Number(priceRands) || 0) * 100),
                deliveryCents: Math.round((Number(deliveryRands) || 0) * 100),
                currency,
                customerName: customerName || undefined,
                customerPhone: customerPhone || undefined,
                customerEmail: customerEmail || null,
                addressLine1: addressLine1 || null,
                suburb: suburb || null,
                city: city || null,
                link,
                api: apiField,
                links: linksText
                  .split(/\n|,/)
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0),
                image,
                estimatedKg: estimatedKg ? Number(estimatedKg) : null,
                supplierId: supplierId || null,
                caretakerId: caretakerId || null,
              });
            }}
          >
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Caretaker</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      placeholder="Search caretakers"
                      value={caretakerQuery}
                      onChange={(e) => setCaretakerQuery(e.target.value)}
                      className="w-full rounded-full border px-3 py-2 text-sm"
                    />
                    <select value={caretakerId} onChange={(e) => setCaretakerId(e.target.value)} className="w-56 rounded-full border px-3 py-2 text-sm">
                      <option value="">Unassigned</option>
                      {caretakers
                        .filter((u) => (u.name ?? "").toLowerCase().includes(caretakerQuery.toLowerCase()))
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name ?? u.email ?? u.id}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Price (R)</label>
                  <input value={priceRands} onChange={(e) => setPriceRands(e.target.value)} type="number" min="0" step="0.01" className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Delivery (R)</label>
                  <input value={deliveryRands} onChange={(e) => setDeliveryRands(e.target.value)} type="number" min="0" step="0.01" className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Currency</label>
                  <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Customer Name</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Customer Phone</label>
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Customer Email</label>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600">Address Line 1</label>
                <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Suburb</label>
                  <input value={suburb} onChange={(e) => setSuburb(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">City</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">External Link</label>
                  <input value={link} onChange={(e) => setLink(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">API</label>
                  <input value={apiField} onChange={(e) => setApiField(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Gallery Links (one per line)</label>
                <textarea value={linksText} onChange={(e) => setLinksText(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium text-gray-700">Cover image</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    const url = getUploadedUrl(res);
                    if (url) setImage(url);
                  }}
                  onUploadError={(error: Error) => alert(`ERROR: ${error.message}`)}
                />
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="Cover" src={image} className="mt-2 h-24 w-24 rounded object-cover" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Estimated Kg</label>
                  <input value={estimatedKg} onChange={(e) => setEstimatedKg(e.target.value)} type="number" step="0.1" min="0" className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Supplier</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      placeholder="Search suppliers"
                      value={supplierQuery}
                      onChange={(e) => setSupplierQuery(e.target.value)}
                      className="w-full rounded-full border px-3 py-2 text-sm"
                    />
                    <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-56 rounded-full border px-3 py-2 text-sm">
                      <option value="">Unassigned</option>
                      {suppliers?.items?.map((s: SupplierRow) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.city ? `• ${s.city}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={update.isPending} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {update.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus.mutate({ orderId: order.id, status: s })}
                className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
              >
                {s.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-3">
          <h2 className="mb-2 text-sm font-semibold">Timeline</h2>
          <ol className="space-y-2 text-sm">
            {order.auditLogs.map((l) => (
              <li key={l.id} className="rounded bg-gray-50 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{l.action}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(l.createdAt).toLocaleString()}
                  </span>
                </div>
                <pre className="mt-1 overflow-auto text-xs text-gray-600">
                  {prettyJson(l.payload)}
                </pre>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {order.payouts.length > 0 && (
        <section className="mt-4 rounded-lg border p-3">
          <h2 className="mb-2 text-sm font-semibold">Payouts</h2>
          <ul className="text-sm">
            {order.payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b py-1 last:border-b-0">
                <span className="flex items-center gap-2">
                  <span className="rounded-full border px-2 py-0.5 text-xs">{p.status}</span>
                  {p.status === "PENDING" && (
                    <>
                      <button
                        className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50"
                        onClick={() => setPayoutStatus.mutate({ payoutId: p.id, status: "RELEASED" })}
                      >Mark Released</button>
                      <button
                        className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50"
                        onClick={() => setPayoutStatus.mutate({ payoutId: p.id, status: "FAILED" })}
                      >Mark Failed</button>
                    </>
                  )}
                </span>
                <span>R {Math.round(p.amountCents / 100)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Payout create */}
      <section className="mt-4 rounded-lg border p-3">
        <h2 className="mb-2 text-sm font-semibold">New Payout</h2>
        <div className="grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-600">Amount (R)</label>
            <input value={payoutRands} onChange={(e) => setPayoutRands(e.target.value.replace(/[^0-9.]/g, ""))} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div className="text-xs text-gray-500">Supplier must be assigned</div>
          <div className="text-right">
            <button
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!order.supplierId || !payoutRands || triggerPayout.isPending}
              onClick={() => {
                const cents = Math.max(0, Math.round(Number(payoutRands || "0") * 100));
                if (!cents || !order.supplierId) return;
                triggerPayout.mutate({ orderId: order.id, supplierId: order.supplierId, amountCents: cents });
              }}
            >{triggerPayout.isPending ? "Creating..." : "Create Payout"}</button>
          </div>
        </div>
      </section>

      {/* Payments */}
      <section className="mt-4 rounded-lg border p-3">
        <h2 className="mb-2 text-sm font-semibold">Payments</h2>
        <div className="mb-3 grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs text-gray-600">Amount (R)</label>
            <input value={payAmount} onChange={(e) => setPayAmount(e.target.value.replace(/[^0-9.]/g, ""))} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Method</label>
            <select value={payProvider} onChange={(e) => setPayProvider(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm">
              {(["CASH","CARD","EFT","OTHER"] as const).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Reference (optional)</label>
            <input value={payRef} onChange={(e) => setPayRef(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!payAmount || addPayment.isPending}
            onClick={() => {
              const cents = Math.max(0, Math.round(Number(payAmount || "0") * 100));
              if (!cents) return;
              addPayment.mutate({ orderId: id, amountCents: cents, provider: payProvider, providerRef: payRef || undefined, status: "PAID" });
            }}
          >{addPayment.isPending ? "Adding..." : "Add Payment"}</button>
        </div>

        {order.payments?.length ? (
          <ul className="mt-3 divide-y text-sm">
            {order.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border px-2 py-0.5 text-xs">{p.status}</span>
                  <span className="text-gray-600">{p.provider}{p.providerRef ? ` · ${p.providerRef}` : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.status !== "PAID" && (
                    <button className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50" onClick={() => setPaymentStatus.mutate({ paymentId: p.id, status: "PAID" })}>Mark Paid</button>
                  )}
                  {p.status !== "FAILED" && (
                    <button className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50" onClick={() => setPaymentStatus.mutate({ paymentId: p.id, status: "FAILED" })}>Mark Failed</button>
                  )}
                  {p.status !== "REFUNDED" && (
                    <button className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50" onClick={() => setPaymentStatus.mutate({ paymentId: p.id, status: "REFUNDED" })}>Mark Refunded</button>
                  )}
                  <span>R {Math.round(p.amountCents / 100)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 text-xs text-gray-500">No payments yet.</div>
        )}
      </section>
    </div>
  );
}
