"use client";

import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "@heroicons/react/16/solid";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

import { MarketplaceTasksPanel } from "~/app/_components/MarketplaceTasksPanel";
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

export default function OrderDetailPage() {
  const itemId = useItemIdFromParams();
  const [open, setOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number | null;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

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

  const resetForm = useCallback(() => {
    setCustomerName("");
    setNote("");
    setCustomerPhone("");
    setAddressLine1("");
    setSuburb("");
    setCity("");
    setQuantityOpt("1");
    setCustomQty("1");
    setCustomerLocation(null);
    setGeoError(null);
    setLocating(false);
  }, []);

  const startStripeCheckout = useCallback(
    async (orderId: number) => {
      setOpen(true);
      setCheckoutError(null);
      setIsRedirecting(true);
      try {
        const response = await fetch("/api/payments/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const data = (await response.json().catch(() => null)) as
          | { checkoutUrl?: string; error?: string }
          | null;

        if (!response.ok || typeof data?.checkoutUrl !== "string") {
          const message =
            data?.error ?? "We couldn't start the secure checkout. Please try again.";
          throw new Error(message);
        }

        resetForm();
        window.location.href = data.checkoutUrl;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to start Stripe checkout. Please try again.";
        setCheckoutError(message);
        setIsRedirecting(false);
      }
    },
    [resetForm, setCheckoutError, setIsRedirecting, setOpen],
  );

  const handleDialogClose = useCallback(
    (nextOpen: boolean) => {
      if (isRedirecting) return;
      setOpen(nextOpen);
      if (!nextOpen) {
        setCheckoutError(null);
      }
    },
    [isRedirecting, setCheckoutError, setOpen],
  );

  const { data: item, isLoading } = api.shopItem.getById.useQuery(
    { id: itemId ?? -1 },
    { enabled: itemId != null },
  );
  const announcementsQuery = api.platform.announcements.useQuery({ limit: 3 });
  const feedPreviewQuery = api.feed.list.useQuery({ limit: 3 });

  const createOrder = api.shopItem.createOrder.useMutation({
    onSuccess: async (order) => {
      if (itemId != null) {
        await utils.shopItem.getById.invalidate({ id: itemId });
      }
      if (order?.id) {
        await startStripeCheckout(order.id);
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

  const announcements = announcementsQuery.data ?? [];
  const feedItems = feedPreviewQuery.data?.items ?? [];
  const quickLinks = [
    {
      title: "Creator marketplace",
      href: "/projects",
      description: "See all open tasks and collaborators.",
    },
    {
      title: "Visit the feed",
      href: "/feed",
      description: "Creator drops, launches, and client wins.",
    },
    {
      title: "Creators dashboard",
      href: "/creators/dashboard",
      description: "Publish updates about your project.",
    },
    {
      title: "Supplier & driver portals",
      href: "/suppliers/dashboard",
      description: "Manage fulfilment teams for this order.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-700 via-purple-600 to-blue-500 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_55%)]" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              Cloudus order payment
            </p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              {item
                ? `Confirm and fund ${item.name}`
                : "Confirm your Cloudus order and secure fulfilment."}
            </h1>
            <p className="text-sm text-white/80">
              Share delivery notes, capture your location, and launch a secure Stripe checkout.
              We also surface feed drops and marketplace contributors so you can keep momentum.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/30"
              >
                Explore feed
              </Link>
              <Link
                href="/projects"
                className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                Open tasks
              </Link>
              {item && (
                <Link
                  href={`/shop/orders/${item.id}/create`}
                  className="rounded-full bg-blue-900/40 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-900/60"
                >
                  Start another order
                </Link>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/10 p-4 text-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">
              Estimated total
            </p>
            <p className="text-3xl font-semibold">
              {item ? formatZAR(estimatedTotalCents) : "Checking inventory..."}
            </p>
            <p className="mt-1 text-white/70">
              Quantity · {qtyNumber}kg • includes supplier payout + delivery prep.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              {isLoading ? (
                <p className="text-center text-gray-500">Loading item…</p>
              ) : item ? (
                <>
                  <div className="mb-6 flex flex-col gap-4 text-center">
                    <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                      <span>Order {itemId}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>{item.type}</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Confirm order</h2>
                    <p className="text-gray-600">
                      {item.description ?? "Capture your laundry request and pay securely."}
                    </p>
                    <div className="flex flex-col items-center gap-4">
                      <img
                        alt={item.name}
                        src={item.image}
                        className="h-16 w-16 rounded-full bg-gray-200 object-cover"
                      />
                      <div className="relative h-48 w-full overflow-hidden rounded-2xl">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                    </div>
                    <p className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                      Estimated total: {formatZAR(estimatedTotalCents)}
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!item) return;

                      createOrder.mutate({
                        itemId,
                        name: `Order: ${item.name}`,
                        description: note || undefined,
                        customerName: customerName || undefined,
                        customerPhone: customerPhone || undefined,
                        addressLine1: addressLine1 || undefined,
                        suburb: suburb || undefined,
                        city: city || undefined,
                        customerLocation: customerLocation
                          ? {
                              lat: customerLocation.lat,
                              lng: customerLocation.lng,
                              accuracy: customerLocation.accuracy ?? undefined,
                            }
                          : undefined,
                        estimatedKg: qtyNumber,
                      });
                    }}
                    className="mt-4 flex flex-col gap-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Address line"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Suburb"
                        value={suburb}
                        onChange={(e) => setSuburb(e.target.value)}
                        className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-full border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <textarea
                      placeholder="Add any special notes or instructions"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-[90px] w-full rounded-2xl border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">
                          Quantity (kg)
                        </label>
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
                          <label className="mb-1 block text-xs text-gray-600">
                            Custom qty
                          </label>
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
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        Share your live location
                      </label>
                      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed px-4 py-3">
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
                                  accuracy: position.coords.accuracy ?? null,
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
                              { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
                            );
                          }}
                          disabled={locating}
                          className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {locating ? "Locating..." : "Use my location"}
                        </button>
                        {customerLocation && (
                          <p className="text-xs text-green-700">
                            Pinned ({customerLocation.lat.toFixed(5)},{" "}
                            {customerLocation.lng.toFixed(5)})
                          </p>
                        )}
                      </div>
                      {geoError && <p className="mt-2 text-xs text-red-600">{geoError}</p>}
                    </div>
                    <button
                      type="submit"
                      className="rounded-full bg-blue-600 px-8 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      disabled={createOrder.isPending || isRedirecting || !item}
                    >
                      {createOrder.isPending
                        ? "Submitting order..."
                        : isRedirecting
                          ? "Redirecting..."
                          : "Launch secure payment"}
                    </button>
                  </form>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                    <p>
                      Need more help? Chat with{" "}
                      <Link href="/assistant" className="text-blue-600 underline">
                        Cloudus Navigator
                      </Link>{" "}
                      for guided steps.
                    </p>
                    <Link
                      href="/shop"
                      className="rounded-full bg-gray-700 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                    >
                      Back to shop
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500">Item not found.</p>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-blue-100 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600">
                    Operations updates
                  </p>
                  <p className="text-sm text-gray-600">Announcements from the Cloudus team</p>
                </div>
                <Link href="/admin" className="text-xs font-semibold text-blue-700">
                  View all
                </Link>
              </div>
              {announcementsQuery.isLoading ? (
                <p className="mt-3 text-sm text-gray-500">Loading updates...</p>
              ) : announcements.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  No announcements right now. Keep an eye on the feed for new drops.
                </p>
              ) : (
                <div className="mt-3 space-y-3 text-sm">
                  {announcements.map((announcement) => (
                    <article
                      key={announcement.id}
                      className="rounded-2xl border border-blue-50 bg-blue-50/60 p-3"
                    >
                      <p className="text-xs uppercase text-blue-700">{announcement.title}</p>
                      <p className="text-gray-600">{announcement.body}</p>
                      {announcement.link && (
                        <Link
                          href={announcement.link}
                          className="mt-1 inline-flex text-xs font-semibold text-blue-700"
                        >
                          Details
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-purple-100 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-purple-600">Feed drops</p>
                  <p className="text-sm text-gray-600">Creator wins & supplier highlights</p>
                </div>
                <Link href="/feed" className="text-xs font-semibold text-purple-700">
                  Feed
                </Link>
              </div>
              {feedPreviewQuery.isLoading ? (
                <p className="mt-3 text-sm text-gray-500">Loading stories...</p>
              ) : feedItems.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">
                  Nothing new yet. Follow <Link href="/feed" className="text-blue-600 underline">the feed</Link>{" "}
                  for launch recaps.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {feedItems.slice(0, 3).map((post) => (
                    <article
                      key={post.id}
                      className="rounded-2xl border border-purple-50 bg-purple-50/40 p-3 text-sm"
                    >
                      <p className="text-xs uppercase text-purple-600">
                        {post.type.replaceAll("_", " ")}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {post.title ?? post.project?.name ?? "Update"}
                      </p>
                      {post.caption && (
                        <p className="text-xs text-gray-600 line-clamp-2">{post.caption}</p>
                      )}
                      {post.project?.id && (
                        <Link
                          href={`/projects/${post.project.id}`}
                          className="mt-1 inline-flex text-xs font-semibold text-purple-700"
                        >
                          View project →
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Quick links</p>
              <ul className="mt-3 space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex flex-col rounded-2xl border border-gray-100 px-4 py-3 transition hover:border-blue-200"
                    >
                      <span className="text-sm font-semibold text-gray-900">{link.title}</span>
                      <span className="text-xs text-gray-600">{link.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <MarketplaceTasksPanel
              role="CREATOR"
              limit={4}
              title="Need a contributor?"
              subtitle="Pitch your project to Cloudus creators."
            />
          </aside>
        </div>
      </div>

      <Dialog open={open} onClose={handleDialogClose} className="relative z-10">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle as="h3" className="mt-4 text-lg font-semibold text-gray-900">
                {checkoutError ? "Unable to start payment" : "Redirecting to secure checkout"}
              </DialogTitle>
              <p className="mt-2 text-sm text-gray-600">
                {checkoutError
                  ? checkoutError
                  : "Hang tight while we launch a secure Stripe payment page for you."}
              </p>
              {checkoutError && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleDialogClose(false)}
                    className="rounded-full border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
