"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { api } from "~/trpc/react";
import { MarketplaceTasksPanel } from "~/app/_components/MarketplaceTasksPanel";
import { FeedSnippetsPanel } from "~/app/_components/FeedSnippetsPanel";

const money = (value?: number, currency = "ZAR") => {
  const cents = typeof value === "number" ? value : 0;
  const amount = cents / 100;
  const prefix = currency === "ZAR" ? "R" : "";
  return `${prefix} ${amount.toFixed(2)}`;
};

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString();
};

const humanStatus = (value: string | null | undefined) =>
  value ? value.replaceAll("_", " ") : "Pending";

export function DashboardClient({ initialName }: { initialName?: string }) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const utils = api.useUtils();

  const dashboardQuery = api.driver.dashboard.useQuery(undefined, {
    refetchInterval: 120_000,
  });
  const shareLocation = api.driver.shareLocation.useMutation({
    onSuccess: async () => {
      await utils.driver.dashboard.invalidate();
    },
  });
  const announcementsQuery = api.platform.announcements.useQuery({ limit: 2 });

  const data = dashboardQuery.data;
  const driverName = data?.driver.name ?? initialName ?? "Driver";

  const requestLocationShare = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Your device does not support location sharing.");
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await shareLocation.mutateAsync({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy ?? undefined,
          });
          await dashboardQuery.refetch();
        } catch (err) {
          setGeoError(
            err instanceof Error
              ? err.message
              : "We could not store your location. Please try again.",
          );
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Permission denied. Please enable location access.");
          return;
        }
        setGeoError(error.message ?? "Unable to fetch your location.");
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    );
  };

  const lastLocationAt = data?.driver.lastLocationAt
    ? new Date(data.driver.lastLocationAt)
    : null;
  const locationLink =
    data?.driver.lastLocationLat && data.driver.lastLocationLng
      ? `https://www.google.com/maps?q=${data.driver.lastLocationLat},${data.driver.lastLocationLng}`
      : null;

  const stats = data?.stats;
  const summaryCards = [
    {
      label: "Active deliveries",
      value: stats?.active ?? 0,
      helper: "currently assigned",
    },
    {
      label: "Completed",
      value: stats?.completed ?? 0,
      helper: "lifetime",
    },
    {
      label: "Pending payout",
      value: money(stats?.pendingPayoutCents),
      helper: "awaiting completion",
    },
    {
      label: "Lifetime payout",
      value: money(stats?.lifetimePayoutCents),
      helper: "delivered + approved",
    },
  ];

  const upcoming = data?.upcomingDeliveries ?? [];
  const recent = data?.recentDeliveries ?? [];
  const payoutHistory = data?.payoutHistory ?? [];

  const isLoading = dashboardQuery.isLoading && !data;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-600">
              Driver control center
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">
              Hi {driverName}
            </h1>
            <p className="text-sm text-gray-600">
              {data?.driver.vehicle
                ? `${data.driver.vehicle} • ${data.driver.city ?? "Area TBD"}`
                : data?.driver.city ?? "Set your vehicle details in profile"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={requestLocationShare}
              disabled={shareLocation.isPending || locating}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
            >
              {shareLocation.isPending || locating
                ? "Sharing location…"
                : "Share live location"}
            </button>
            <button
              type="button"
              onClick={() => dashboardQuery.refetch()}
              disabled={dashboardQuery.isFetching}
              className="rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
            >
              {dashboardQuery.isFetching ? "Syncing…" : "Refresh data"}
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-700">
          <p>
            Last shared location:{" "}
            {lastLocationAt
              ? `${formatDistanceToNow(lastLocationAt, { addSuffix: true })}${
                  locationLink
                    ? " · "
                    : ""
                }`
              : "Never shared"}
            {locationLink && (
              <a
                href={locationLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-700 underline"
              >
                Open map
              </a>
            )}
          </p>
          {data?.driver.lastLocationAccuracy && (
            <p className="text-xs text-gray-500">
              Accuracy ±{Math.round(data.driver.lastLocationAccuracy)}m
            </p>
          )}
        </div>
        {geoError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {geoError}
          </div>
        )}
      </section>

      <section className="grid gap-4 rounded-3xl border border-gray-100 bg-white/80 p-5 shadow-sm lg:grid-cols-[2fr,1fr]">
        <FeedSnippetsPanel
          className="h-full"
          subtitle="Logistics & delivery drops from the Cloudus feed."
        />
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Announcements</p>
            {announcementsQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            ) : (announcementsQuery.data ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">No new announcements.</p>
            ) : (
              (announcementsQuery.data ?? []).map((announcement) => (
                <div key={announcement.id} className="mt-2 rounded-xl bg-blue-50/60 p-3 text-xs">
                  <p className="font-semibold text-gray-900">{announcement.title}</p>
                  <p className="text-gray-600">{announcement.body}</p>
                  {announcement.link && (
                    <Link
                      href={announcement.link}
                      className="inline-flex text-blue-700 underline"
                    >
                      Details
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
          <MarketplaceTasksPanel role="DRIVER" limit={4} title="Available delivery tasks" />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase text-gray-500">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {card.value}
            </p>
            <p className="text-xs text-gray-500">{card.helper}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-white shadow-sm">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Active deliveries
            </h2>
            <p className="text-sm text-gray-500">
              {upcoming.length
                ? `${upcoming.length} deliveries in progress`
                : "No active routes right now"}
            </p>
          </div>
        </header>
        {upcoming.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            You have no pickups or drop-offs right now. We'll notify you when a
            new order is assigned.
          </div>
        ) : (
          <ul className="divide-y">
            {upcoming.map((delivery) => (
              <li
                key={delivery.id}
                className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {delivery.order?.code ?? "Order"}
                    <span className="ml-2 text-xs text-gray-500">
                      {delivery.order?.customerName ?? "Customer"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {[delivery.order?.suburb, delivery.order?.city]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="text-xs text-gray-500">
                    Pickup window: {formatDateTime(delivery.pickupWindowStart)}{" "}
                    → {formatDateTime(delivery.pickupWindowEnd)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Drop-off window:{" "}
                    {formatDateTime(delivery.dropoffWindowStart)} →{" "}
                    {formatDateTime(delivery.dropoffWindowEnd)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                    {humanStatus(delivery.status)}
                  </span>
                  <p className="mt-1 text-xs text-gray-500">
                    Fee: {money(delivery.order?.deliveryCents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white shadow-sm">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Recent orders
            </h2>
            <p className="text-sm text-gray-500">
              Latest assignments across your route
            </p>
          </div>
        </header>
        {recent.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            Orders you’re assigned to will appear here once scheduled.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Area</th>
                  <th className="px-3 py-2">Order status</th>
                  <th className="px-3 py-2">Delivery status</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent.map((delivery) => {
                  const order = delivery.order;
                  const orderTotal =
                    (order?.price ?? 0) + (order?.deliveryCents ?? 0);
                  return (
                    <tr key={delivery.id} className="text-gray-700">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-gray-900">
                          {order?.code ?? "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(order?.createdAt)}
                        </div>
                      </td>
                      <td className="px-3 py-2">{order?.customerName ?? "—"}</td>
                      <td className="px-3 py-2">
                        {[order?.suburb, order?.city].filter(Boolean).join(", ")}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium uppercase text-slate-600">
                        {humanStatus(order?.status ?? null)}
                      </td>
                      <td className="px-3 py-2 text-xs uppercase text-slate-600">
                        {humanStatus(delivery.status)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">
                        {money(orderTotal)}
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
              Payout history
            </h2>
            <p className="text-sm text-gray-500">
              Delivery fees completed vs. pending
            </p>
          </div>
        </header>
        {payoutHistory.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            Once you start completing deliveries, we will track fees here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payoutHistory.map((row) => (
                  <tr key={row.id} className="text-gray-700">
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-900">
                        {row.order?.code ?? "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.order?.customerName ?? "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-900">
                      {money(row.amountCents)}
                    </td>
                    <td className="px-3 py-2 text-xs uppercase text-slate-600">
                      {humanStatus(row.deliveryStatus)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {row.deliveredAt
                        ? formatDistanceToNow(new Date(row.deliveredAt), {
                            addSuffix: true,
                          })
                        : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isLoading && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Loading your assignments…
        </div>
      )}
    </div>
  );
}
