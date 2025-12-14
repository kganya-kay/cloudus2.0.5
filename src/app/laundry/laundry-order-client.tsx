"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CheckIcon } from "@heroicons/react/16/solid";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { api, type RouterInputs } from "~/trpc/react";

export function LaundryOrderClient() {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [suburb, setSuburb] = useState("");
  const [city, setCity] = useState("");
  const [serviceType, setServiceType] = useState("wash-fold");
  const [instructions, setInstructions] = useState("");
  const [estimatedKg, setEstimatedKg] = useState("5");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [customerLocation, setCustomerLocation] =
    useState<RouterInputs["order"]["createLaundry"]["customerLocation"] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const utils = api.useUtils();

  const startPaystackCheckout = useCallback(async (orderId: number) => {
    setDialogOpen(true);
    setRedirecting(true);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/payments/paystack/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await response.json().catch(() => null)) as {
        checkoutUrl?: string;
        error?: string;
      } | null;
      if (!response.ok || typeof data?.checkoutUrl !== "string") {
        throw new Error(data?.error ?? "Unable to start payment. Please try again.");
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setRedirecting(false);
      setCheckoutError(
        err instanceof Error ? err.message : "Payment error. Please try again.",
      );
    }
  }, []);

  const createOrder = api.order.createLaundry.useMutation({
    onSuccess: async (order) => {
      await utils.order.getLatest.invalidate().catch(() => undefined);
      await startPaystackCheckout(order.id);
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const weight = Number(estimatedKg);
    if (!Number.isFinite(weight) || weight <= 0) {
      setCheckoutError("Estimated weight must be a positive number.");
      setDialogOpen(true);
      return;
    }
    createOrder.mutate({
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      addressLine1,
      suburb,
      city,
      serviceType,
      instructions: instructions || undefined,
      estimatedKg: weight,
      customerLocation: customerLocation ?? undefined,
    });
  };

  const disabled = createOrder.isPending || redirecting;

  return (
    <>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-3">
          <input
            className="w-full rounded-full border px-4 py-2 text-sm"
            placeholder="Full name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <input
            className="w-full rounded-full border px-4 py-2 text-sm"
            placeholder="Email (for receipts)"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
          <input
            className="w-full rounded-full border px-4 py-2 text-sm"
            placeholder="WhatsApp / Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
          />
          <input
            className="w-full rounded-full border px-4 py-2 text-sm"
            placeholder="Pickup address"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            required
          />
          <div className="flex gap-3">
            <input
              className="w-full rounded-full border px-4 py-2 text-sm"
              placeholder="Suburb"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              required
            />
            <input
              className="w-full rounded-full border px-4 py-2 text-sm"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3">
            <select
              className="w-full rounded-full border px-4 py-2 text-sm"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <option value="wash-fold">Wash & Fold</option>
              <option value="wash-iron">Wash, Dry & Iron</option>
              <option value="dry-cleaning">Dry Cleaning</option>
            </select>
            <input
              className="w-32 rounded-full border px-4 py-2 text-sm"
              placeholder="Kg"
              type="number"
              min="1"
              step="0.5"
              value={estimatedKg}
              onChange={(e) => setEstimatedKg(e.target.value)}
              required
            />
          </div>
          <div className="rounded-2xl border border-dashed border-blue-200 px-4 py-3 text-xs text-gray-600">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Share my pickup location</p>
                <p className="text-xs text-gray-500">
                  Pin your GPS coordinates to help drivers find you faster.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator === "undefined" || !navigator.geolocation) {
                    setGeoError("Your device cannot share location.");
                    return;
                  }
                  setLocating(true);
                  setGeoError(null);
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setCustomerLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy ?? undefined,
                      });
                      setLocating(false);
                    },
                    (error) => {
                      setGeoError(
                        error.code === error.PERMISSION_DENIED
                          ? "Permission denied. Please enable location access."
                          : error.message ?? "Unable to fetch your location.",
                      );
                      setLocating(false);
                    },
                    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
                  );
                }}
                disabled={locating}
                className="rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-700 disabled:opacity-60"
              >
                {locating ? "Capturing..." : "Use my GPS"}
              </button>
            </div>
            {customerLocation && (
              <p className="mt-2 text-xs text-green-700">
                Location pinned ({customerLocation.lat.toFixed(5)}, {customerLocation.lng.toFixed(5)})
              </p>
            )}
            {geoError && <p className="mt-2 text-xs text-red-600">{geoError}</p>}
          </div>
        </div>
        <div className="space-y-3">
          <textarea
            className="h-32 w-full rounded-2xl border px-4 py-2 text-sm"
            placeholder="Pickup instructions, gate codes, stains, etc."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
          <div className="rounded-2xl border border-dashed px-4 py-3 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Estimated total</p>
            <p className="text-xs text-gray-500">
              Final amount is confirmed once the supplier weighs your bag.
            </p>
            <p className="mt-2 text-xl font-bold text-gray-900">
              {formatEstimate(Number(estimatedKg))}
            </p>
          </div>
          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {createOrder.isPending || redirecting ? "Submitting..." : "Proceed to payment"}
          </button>
          <p className="text-xs text-gray-500">
            By submitting you agree to receive status updates by email/SMS/WhatsApp.
          </p>
        </div>
      </form>

      <Dialog open={dialogOpen} onClose={() => (!redirecting ? setDialogOpen(false) : null)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <CheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle as="h3" className="mt-4 text-lg font-semibold text-gray-900">
                {checkoutError ? "Payment issue" : "Redirecting to payment"}
              </DialogTitle>
              <p className="mt-2 text-sm text-gray-600">
                {checkoutError ?? "Hang tight while we launch a secure payment page for you."}
              </p>
              {checkoutError && (
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="rounded-full border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <Link
                    href="/laundry"
                    className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Try again
                  </Link>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

const formatEstimate = (kg: number) => {
  if (!Number.isFinite(kg) || kg <= 0) return "—";
  const price = Math.round(kg) * 40 + 50;
  return `~ R${price.toFixed(0)}`;
};
