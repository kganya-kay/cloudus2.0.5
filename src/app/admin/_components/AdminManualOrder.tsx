"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";
import type { DriverListRow, DriverListResponse } from "~/types/api";

type ActiveField = "phone" | "price" | "delivery";

export default function AdminManualOrder() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ActiveField>("phone");

  // form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [priceStr, setPriceStr] = useState(""); // rands
  const [deliveryStr, setDeliveryStr] = useState(""); // rands
  const [method, setMethod] = useState<string>("CASH");
  const [ref, setRef] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [driverId, setDriverId] = useState("");

  const utils = api.useUtils();

  const priceCents = useMemo(() => Math.max(0, Math.round(Number(priceStr || "0") * 100)), [priceStr]);
  const deliveryCents = useMemo(() => Math.max(0, Math.round(Number(deliveryStr || "0") * 100)), [deliveryStr]);
  const requiresDriver = deliveryCents > 0;

  const createManual = api.order.createManual.useMutation({
    onSuccess: async () => {
      setOpen(false);
      // reset
      setCustomerName(""); setCustomerPhone(""); setCustomerEmail("");
      setAddressLine1(""); setSuburb(""); setCity(""); setNote("");
      setPriceStr(""); setDeliveryStr(""); setMethod("CASH"); setRef("");
      setDriverId(""); setDriverSearch("");
      await utils.order.listToday.invalidate();
    },
  });
  const driverResult = api.driver.list.useQuery({
    q: driverSearch || undefined,
    onlyActive: true,
    page: 1,
    pageSize: 50,
  }) as { data: DriverListResponse | undefined };
  const driverOptions: DriverListRow[] = driverResult.data?.items ?? [];

  const onDigit = (d: string) => {
    if (!open) return;
    if (!/^[0-9]$/.test(d)) return;
    if (active === "phone") setCustomerPhone((v) => (v + d).slice(0, 20));
    if (active === "price") setPriceStr((v) => (v + d).slice(0, 8));
    if (active === "delivery") setDeliveryStr((v) => (v + d).slice(0, 8));
  };
  const onBackspace = () => {
    if (active === "phone") setCustomerPhone((v) => v.slice(0, -1));
    if (active === "price") setPriceStr((v) => v.slice(0, -1));
    if (active === "delivery") setDeliveryStr((v) => v.slice(0, -1));
  };
  const onClear = () => {
    if (active === "phone") setCustomerPhone("");
    if (active === "price") setPriceStr("");
    if (active === "delivery") setDeliveryStr("");
  };

  const submit = () => {
    if (!customerName || !customerPhone || !priceCents) return;
    if (requiresDriver && !driverId) {
      alert("Assign a driver when a delivery fee is charged.");
      return;
    }
    createManual.mutate({
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      addressLine1: addressLine1 || undefined,
      suburb: suburb || undefined,
      city: city || undefined,
      note: note || undefined,
      priceCents,
      deliveryCents,
      paymentMethod: method,
      paymentRef: ref || undefined,
      driverId: driverId || undefined,
    });
  };

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-2 inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
      >
        <span className={`inline-block h-5 w-5 rounded-full border text-center leading-5 ${open ? "rotate-45" : ""}`}>+</span>
        Manual Order
      </button>

      <div className={`overflow-hidden rounded-lg border bg-white transition-all duration-300 ${open ? "max-h-[1200px] p-3" : "max-h-0 p-0"}`}>
        {/* Basic info */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="col-span-1">
            <label className="mb-1 block text-xs text-gray-600">Customer Name</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">Phone</label>
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} onFocus={() => setActive("phone")} className="w-full rounded border px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">Email</label>
            <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
          </div>
          <div className="md:col-span-3 grid grid-cols-3 gap-3">
            <div className="col-span-3 md:col-span-1">
              <label className="mb-1 block text-xs text-gray-600">Address</label>
              <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">Suburb</label>
              <input value={suburb} onChange={(e) => setSuburb(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-xs text-gray-600">Note</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
          </div>
        </div>

        {/* Amounts & keypad */}
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-gray-600">Price (R)</label>
            <input value={priceStr} onChange={(e) => setPriceStr(e.target.value.replace(/[^0-9.]/g, ""))} onFocus={() => setActive("price")} className="w-full rounded border px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">Delivery (R)</label>
            <input value={deliveryStr} onChange={(e) => setDeliveryStr(e.target.value.replace(/[^0-9.]/g, ""))} onFocus={() => setActive("delivery")} className="w-full rounded border px-2 py-1 text-sm" />
            {requiresDriver && !driverId && (
              <p className="mt-1 text-xs text-red-600">Driver required when delivery is charged.</p>
            )}
          </div>
          <div className="rounded border p-2">
            <div className="mb-2 flex gap-2 text-xs">
              <button className={`rounded border px-2 py-1 ${active === "phone" ? "bg-gray-100" : ""}`} onClick={() => setActive("phone")}>Phone</button>
              <button className={`rounded border px-2 py-1 ${active === "price" ? "bg-gray-100" : ""}`} onClick={() => setActive("price")}>Price</button>
              <button className={`rounded border px-2 py-1 ${active === "delivery" ? "bg-gray-100" : ""}`} onClick={() => setActive("delivery")}>Delivery</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["1","2","3","4","5","6","7","8","9","0"].map((d) => (
                <button key={d} onClick={() => onDigit(d)} className="rounded bg-gray-100 py-2 text-sm font-medium hover:bg-gray-200">{d}</button>
              ))}
              <button onClick={onBackspace} className="col-span-2 rounded bg-gray-100 py-2 text-sm hover:bg-gray-200">Backspace</button>
              <button onClick={onClear} className="rounded bg-gray-100 py-2 text-sm hover:bg-gray-200">Clear</button>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs text-gray-600">Driver</label>
            <div className="flex gap-2">
              <input
                placeholder="Search drivers"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm"
              />
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="w-48 rounded border px-2 py-1 text-sm">
                <option value="">Unassigned</option>
                {driverOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name ?? d.phone ?? d.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="flex items-center gap-2">
            {(["CASH","CARD","EFT","OTHER"]).map((m) => (
              <button key={m} onClick={() => setMethod(m)} className={`rounded border px-3 py-1 text-xs ${method === m ? "bg-gray-100" : ""}`}>{m}</button>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">Payment Ref (optional)</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
          </div>
          <div className="text-sm text-gray-700 flex items-end">Total: R {Math.round((priceCents + deliveryCents)/100)}</div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded border px-3 py-1.5 text-sm">Cancel</button>
          <button onClick={submit} disabled={!customerName || !customerPhone || !priceCents || createManual.isPending} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            {createManual.isPending ? "Saving..." : "Create Order"}
          </button>
        </div>
      </div>
    </section>
  );
}
