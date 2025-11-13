"use client";

import { useEffect, useMemo, useState } from "react";
import type { RouterInputs } from "~/trpc/react";
import { api } from "~/trpc/react";

const money = (value?: number, currency = "ZAR") => {
  const cents = typeof value === "number" ? value : 0;
  const amount = cents / 100;
  const prefix = currency === "ZAR" ? "R" : "";
  return `${prefix}${amount.toFixed(2)}`;
};

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
};

interface SupplierDashboardClientProps {
  initialSupplierId?: string | null;
  initialSupplierName?: string | null;
  viewerRole: "ADMIN" | "CARETAKER" | "SUPPLIER" | string;
}

export function SupplierDashboardClient({
  initialSupplierId,
  initialSupplierName,
  viewerRole,
}: SupplierDashboardClientProps) {
  const canImpersonate =
    viewerRole === "ADMIN" || viewerRole === "CARETAKER";
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [suburbInput, setSuburbInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [accuracyInput, setAccuracyInput] = useState("");

  const dashboardInput = canImpersonate && supplierId
    ? { supplierId }
    : undefined;

  const dashboardQuery = api.supplier.dashboard.useQuery(dashboardInput, {
    enabled: canImpersonate ? Boolean(supplierId) : true,
  });

  const supplierListQuery = api.supplier.list.useQuery(
    {
      q: supplierSearch || undefined,
      page: 1,
      pageSize: 50,
      onlyActive: true,
    },
    { enabled: canImpersonate },
  );

  const createItem = api.supplier.portalCreateShopItem.useMutation({
    onSuccess: async () => {
      await dashboardQuery.refetch();
    },
  });

  const updateLocation = api.supplier.portalUpdateLocation.useMutation({
    onSuccess: async () => {
      setShareMessage("Location saved.");
      setGeoError(null);
      await dashboardQuery.refetch();
    },
    onError: (err) => {
      setGeoError(err.message ?? "Unable to save location.");
    },
  });

  const supplierName =
    dashboardQuery.data?.supplier.name ??
    initialSupplierName ??
    "Supplier";

  const isLoading = dashboardQuery.isLoading || dashboardQuery.isRefetching;
  const data = dashboardQuery.data;
  const canEditLocation = viewerRole === "SUPPLIER" && !canImpersonate;

  useEffect(() => {
    if (!data?.supplier) return;
    setAddressLine1(data.supplier.addressLine1 ?? "");
    setSuburbInput(data.supplier.suburb ?? "");
    setCityInput(data.supplier.city ?? "");
    setLatInput(
      typeof data.supplier.lastLocationLat === "number"
        ? data.supplier.lastLocationLat.toString()
        : "",
    );
    setLngInput(
      typeof data.supplier.lastLocationLng === "number"
        ? data.supplier.lastLocationLng.toString()
        : "",
    );
    setAccuracyInput(
      typeof data.supplier.lastLocationAccuracy === "number"
        ? data.supplier.lastLocationAccuracy.toString()
        : "",
    );
    setShareMessage(null);
    setGeoError(null);
  }, [
    data?.supplier?.id,
    data?.supplier?.addressLine1,
    data?.supplier?.suburb,
    data?.supplier?.city,
    data?.supplier?.lastLocationLat,
    data?.supplier?.lastLocationLng,
    data?.supplier?.lastLocationAccuracy,
  ]);

  const handleUseGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Your device does not support sharing location.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    setShareMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatInput(position.coords.latitude.toString());
        setLngInput(position.coords.longitude.toString());
        setAccuracyInput(
          typeof position.coords.accuracy === "number"
            ? position.coords.accuracy.toString()
            : "",
        );
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
  };

  const handleSaveLocation = (event: React.FormEvent) => {
    event.preventDefault();
    const latNum =
      latInput.trim().length > 0 ? Number(latInput.trim()) : undefined;
    const lngNum =
      lngInput.trim().length > 0 ? Number(lngInput.trim()) : undefined;
    const accuracyNum =
      accuracyInput.trim().length > 0 ? Number(accuracyInput.trim()) : undefined;

    if ((latNum != null && !Number.isFinite(latNum)) || (lngNum != null && !Number.isFinite(lngNum))) {
      setGeoError("Latitude and longitude must be numeric.");
      return;
    }

    const locationPayload =
      latNum != null && lngNum != null
        ? {
            lat: latNum,
            lng: lngNum,
            accuracy:
              accuracyNum != null && Number.isFinite(accuracyNum)
                ? accuracyNum
                : undefined,
          }
        : undefined;

    updateLocation.mutate({
      addressLine1: addressLine1.trim(),
      suburb: suburbInput.trim(),
      city: cityInput.trim(),
      location: locationPayload,
    });
  };

  return (
    <div className="space-y-6">
      {canImpersonate && (
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700">
            View as supplier
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              placeholder="Search suppliers"
              className="w-full rounded-full border px-3 py-2 text-sm md:w-64"
            />
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-full border px-3 py-2 text-sm md:w-64"
            >
              <option value="">Select supplier</option>
              {supplierListQuery.data?.items?.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name ?? supplier.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {canImpersonate && !supplierId ? (
        <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-500">
          Select a supplier to view their dashboard.
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
          Loading supplier data...
        </div>
      ) : !data ? (
        <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-500">
          No supplier data found.
        </div>
      ) : (
        <>
          <header className="rounded-2xl border bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-600">
                  Supplier portal
                </p>
                <h1 className="text-3xl font-bold text-gray-900">
                  Hi {supplierName}
                </h1>
                <p className="text-sm text-gray-600">
                  Track your active orders, payouts, and catalog items in one place.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <StatCard
                label="Active orders"
                value={data.stats.activeOrders}
                helper="in progress"
              />
              <StatCard
                label="Completed"
                value={data.stats.completedOrders}
                helper="delivered"
              />
              <StatCard
                label="Pending payouts"
                value={money(data.stats.pendingPayoutCents)}
                helper="awaiting release"
              />
              <StatCard
                label="Released payouts"
                value={money(data.stats.releasedPayoutCents)}
                helper="paid out"
              />
            </div>
          </header>

          <section className="rounded-2xl border bg-white shadow-sm">
            <header className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pickup location</h2>
                <p className="text-sm text-gray-500">
                  Set your preferred pickup address and GPS coordinates.
                </p>
              </div>
            </header>
            {canEditLocation ? (
              <form className="grid gap-3 p-4 sm:grid-cols-2" onSubmit={handleSaveLocation}>
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase text-gray-500">Street address</label>
                  <input
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="123 Main Road"
                    className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-gray-500">Suburb</label>
                  <input
                    value={suburbInput}
                    onChange={(e) => setSuburbInput(e.target.value)}
                    placeholder="Suburb"
                    className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-gray-500">City</label>
                  <input
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="City"
                    className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-gray-500">Latitude</label>
                  <input
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    placeholder="-26.2041"
                    className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-gray-500">Longitude</label>
                  <input
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    placeholder="28.0473"
                    className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-gray-500">Accuracy (m)</label>
                  <input
                    value={accuracyInput}
                    onChange={(e) => setAccuracyInput(e.target.value)}
                    placeholder="5"
                    className="mt-1 w-full rounded-full border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleUseGps}
                    disabled={locating}
                    className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-60"
                  >
                    {locating ? "Capturing..." : "Use my current GPS"}
                  </button>
                  <button
                    type="submit"
                    disabled={updateLocation.isPending}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {updateLocation.isPending ? "Saving..." : "Save location"}
                  </button>
                </div>
                {(geoError || updateLocation.error) && (
                  <p className="sm:col-span-2 text-xs text-red-600">
                    {geoError ?? updateLocation.error?.message}
                  </p>
                )}
                {shareMessage && (
                  <p className="sm:col-span-2 text-xs text-emerald-700">{shareMessage}</p>
                )}
              </form>
            ) : (
              <div className="grid gap-2 p-4 text-sm">
                <p>
                  <span className="text-gray-500">Address:</span>{" "}
                  {data.supplier.addressLine1 ?? "—"}
                </p>
                <p>
                  <span className="text-gray-500">Area:</span>{" "}
                  {[data.supplier.suburb, data.supplier.city].filter(Boolean).join(", ") || "—"}
                </p>
                <p>
                  <span className="text-gray-500">Coordinates:</span>{" "}
                  {typeof data.supplier.lastLocationLat === "number" &&
                  typeof data.supplier.lastLocationLng === "number"
                    ? `${data.supplier.lastLocationLat.toFixed(5)}, ${data.supplier.lastLocationLng.toFixed(5)}`
                    : "Not set"}
                </p>
                <p>
                  <span className="text-gray-500">Last updated:</span>{" "}
                  {data.supplier.lastLocationAt
                    ? formatDateTime(data.supplier.lastLocationAt) ?? "—"
                    : "—"}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white shadow-sm">
            <header className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Active orders
                </h2>
                <p className="text-sm text-gray-500">
                  Orders currently assigned to you
                </p>
              </div>
            </header>
            {data.activeOrders.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">
                No active orders at the moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Order
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Customer
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Area
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.activeOrders.map((order) => {
                      const total =
                        (order.price ?? 0) + (order.deliveryCents ?? 0);
                      return (
                        <tr key={order.id}>
                          <td className="px-4 py-2 font-semibold text-gray-900">
                            {order.code}
                            <div className="text-xs text-gray-500">
                              {formatDateTime(order.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {order.customerName ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {[order.suburb, order.city]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>
                          <td className="px-4 py-2 text-xs font-medium uppercase text-emerald-700">
                            {order.status.replaceAll("_", " ")}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">
                            {money(total, order.currency ?? "ZAR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white shadow-sm">
            <header className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent orders
                </h2>
                <p className="text-sm text-gray-500">
                  Latest activity across your assignments
                </p>
              </div>
            </header>
            {data.recentOrders.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">
                No orders yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Order
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Created
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.recentOrders.map((order) => {
                      const total =
                        (order.price ?? 0) + (order.deliveryCents ?? 0);
                      return (
                        <tr key={order.id}>
                          <td className="px-4 py-2 font-semibold text-gray-900">
                            {order.code}
                            <div className="text-xs text-gray-500">
                              {order.name ?? "—"}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs uppercase text-gray-600">
                            {order.status.replaceAll("_", " ")}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {formatDateTime(order.createdAt) ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">
                            {money(total, order.currency ?? "ZAR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white shadow-sm">
            <header className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Payouts
                </h2>
                <p className="text-sm text-gray-500">
                  Most recent supplier payouts
                </p>
              </div>
            </header>
            {data.payouts.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">
                No payout history yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Order
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">
                        Released
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-gray-600">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.payouts.map((payout) => (
                      <tr key={payout.id}>
                        <td className="px-4 py-2 font-semibold text-gray-900">
                          {payout.order?.code ?? payout.orderId}
                          <div className="text-xs text-gray-500">
                            {formatDateTime(
                              payout.releasedAt ?? payout.order?.createdAt,
                            ) ?? "—"}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-xs uppercase text-gray-600">
                          {payout.status}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {formatDateTime(payout.releasedAt) ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900">
                          {money(payout.amountCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-white shadow-sm">
              <header className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Catalog
                  </h2>
                  <p className="text-sm text-gray-500">
                    Manage and add shop items
                  </p>
                </div>
              </header>
              {data.shopItems.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">
                  No items yet. Use the form to add your first product.
                </div>
              ) : (
                <div className="divide-y">
                  {data.shopItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-500">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-semibold text-gray-900">
                          {item.name}
                        </span>
                        <span className="text-xs uppercase text-gray-500">
                          {item.type}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {money(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <QuickAddItem
              onCreate={(payload) => createItem.mutateAsync(payload)}
              busy={createItem.isPending}
              serverError={createItem.error?.message ?? null}
            />
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border bg-white/70 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{helper}</p>
    </div>
  );
}

type QuickAddPayload =
  RouterInputs["supplier"]["portalCreateShopItem"];

function QuickAddItem({
  onCreate,
  busy,
  serverError,
}: {
  onCreate: (input: QuickAddPayload) => Promise<unknown>;
  busy: boolean;
  serverError: string | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const priceCents = useMemo(() => {
    const parsed = Number(price);
    if (!Number.isFinite(parsed)) return 0;
    return Math.round(parsed * 100);
  }, [price]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (priceCents <= 0) {
      setError("Price must be greater than zero.");
      return;
    }
    try {
      await onCreate({
        name,
        description,
        type,
        priceCents,
        image: image || undefined,
        link: link || undefined,
      });
      setMessage("Item created.");
      setName("");
      setDescription("");
      setType("");
      setPrice("");
      setImage("");
      setLink("");
    } catch {
      setError("Could not create item. Please try again.");
    }
  };

  return (
    <form className="rounded-2xl border bg-white p-4 shadow-sm" onSubmit={onSubmit}>
      <h2 className="text-lg font-semibold text-gray-900">
        Quick add item
      </h2>
      <p className="text-sm text-gray-500">
        Publish a new item to your catalog.
      </p>
      <div className="mt-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="w-full rounded-full border px-3 py-2 text-sm"
          required
        />
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Category / type"
          className="w-full rounded-full border px-3 py-2 text-sm"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description"
          className="w-full rounded-2xl border px-3 py-2 text-sm"
          rows={3}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (R)"
          className="w-full rounded-full border px-3 py-2 text-sm"
          required
        />
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL (optional)"
          className="w-full rounded-full border px-3 py-2 text-sm"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="External link (optional)"
          className="w-full rounded-full border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Saving..." : "Add item"}
        </button>
        {(error || serverError) && (
          <p className="text-xs text-red-600">
            {error ?? serverError}
          </p>
        )}
        {message && <p className="text-xs text-emerald-700">{message}</p>}
      </div>
    </form>
  );
}
