"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "@heroicons/react/16/solid";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { api } from "~/trpc/react";

/** ZAR formatter (cents -> rands, no decimals) */
function formatZAR(cents: number) {
  const rands = Math.round(cents / 100);
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(rands);
  } catch {
    return `R ${rands}`;
  }
}

/** Safely get the numeric item id from route params */
function useItemIdFromParams(): number | null {
  const params = useParams<{ orderId?: string | string[] }>();
  const raw = Array.isArray(params?.orderId) ? params?.orderId?.[0] : params?.orderId;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export default function CreateOrderPage() {
  const itemId = useItemIdFromParams();
  const [open, setOpen] = useState(false);

  // form state (maps to createOrder input fields)
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [quantityOpt, setQuantityOpt] = useState<string>("1");
  const [customQty, setCustomQty] = useState<string>("1");

  const utils = api.useUtils();

  const { data: item, isLoading } = api.shopItem.getById.useQuery(
    { id: itemId ?? -1 },
    { enabled: itemId != null }
  );

  const createOrder = api.shopItem.createOrder.useMutation({
    onSuccess: async () => {
      // reset + success UI
      setOpen(true);
      setCustomerName("");
      setNote("");
      setCustomerPhone("");
      setAddressLine1("");
      setSuburb("");
      setCity("");
      setQuantityOpt("1");
      setCustomQty("1");
      // refresh item (orders list, etc.)
      if (itemId != null) {
        await utils.shopItem.getById.invalidate({ id: itemId });
      }
    },
  });

  const qtyNumber = useMemo(() => {
    if (quantityOpt === "custom") {
      const n = Number(customQty);
      return Number.isFinite(n) && n > 0 ? n : 1;
    }
    return Number(quantityOpt) || 1;
  }, [quantityOpt, customQty]);

  const estimatedTotalCents = useMemo(() => {
    if (!item) return 0;
    return (item.price ?? 0) * qtyNumber;
  }, [item, qtyNumber]);

  if (itemId == null) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Invalid item id in the URL.
        </p>
        <div className="mt-4">
          <Link
            href="/shop"
            className="rounded-full bg-gray-700 px-6 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-4 shadow-md sm:p-6">
      {/* Selected Item Preview */}
      {isLoading ? (
        <p className="text-center text-gray-500">Loading item…</p>
      ) : item ? (
        <>
          <div className="mb-4 text-center">
            <h1 className="text-xl font-bold text-gray-800">Confirm Order</h1>
            <p className="text-gray-500">{item.name}</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <img
              alt={item.name}
              src={item.image}
              className="h-16 w-16 rounded-full bg-gray-200 object-cover"
            />
            <p className="text-center text-sm text-gray-600">{item.description}</p>
            <div className="relative h-52 w-full overflow-hidden rounded-lg">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
          </div>

          <p className="mt-4 rounded-lg bg-green-100 py-2 text-center font-semibold text-green-700">
            Total (est.): {formatZAR(estimatedTotalCents)}
          </p>
        </>
      ) : (
        <p className="text-center text-gray-500">Item not found.</p>
      )}

      {/* Order Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!item) return;

          createOrder.mutate({
            itemId,
            name: `Order: ${item.name}`, // optional order title
            description: note || undefined,
            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            addressLine1: addressLine1 || undefined,
            suburb: suburb || undefined,
            city: city || undefined,
            estimatedKg: qtyNumber, // treat quantity as estimated KG for laundry
            // deliveryCents: 0, // set if you add delivery
            // currency: "ZAR",
            // priceCentsOverride: estimatedTotalCents, // uncomment if you want to fix price now
          });
        }}
        className="mt-6 flex flex-col gap-4"
      >
        <input
          type="text"
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          required
        />

        <input
          type="tel"
          placeholder="WhatsApp / Phone"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          required
        />

        <textarea
          placeholder="Additional info (notes, instructions)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
          rows={3}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs text-gray-600">Address line</label>
            <input
              type="text"
              placeholder="Street & number"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Suburb</label>
            <input
              type="text"
              placeholder="Suburb"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">City</label>
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-600">Quantity (kg)</label>
            <select
              name="quantity"
              value={quantityOpt}
              onChange={(e) => setQuantityOpt(e.target.value)}
              className="mt-1 w-full rounded-full border px-4 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-blue-400"
            >
              <option value="1">1</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="custom">Custom…</option>
            </select>
          </div>

          {quantityOpt === "custom" && (
            <div>
              <label className="mb-1 block text-xs text-gray-600">Custom qty</label>
              <input
                type="number"
                min={1}
                step={1}
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
                className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="rounded-full bg-blue-500 px-8 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          disabled={createOrder.isPending || !item}
        >
          {createOrder.isPending ? "Submitting Order..." : "Submit"}
        </button>
      </form>

      {/* Back Home */}
      <div className="mt-4 flex justify-center">
        <Link
          href="/shop"
          className="rounded-full bg-gray-600 px-8 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
        >
          Back to Shop
        </Link>
      </div>

      {/* Success Dialog */}
      <Dialog open={open} onClose={setOpen} className="relative z-10">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle as="h3" className="mt-4 text-lg font-semibold text-gray-900">
                Order Created Successfully!
              </DialogTitle>
              <p className="mt-2 text-sm text-gray-600">You’ll receive a payment link via:</p>
              <p className="text-sm font-medium text-gray-800">Contact: {customerPhone || "—"}</p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/shop"
                  className="rounded-full bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Shop
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
