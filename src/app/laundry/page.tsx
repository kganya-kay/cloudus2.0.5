import { Metadata } from "next";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { HydrateClient } from "~/trpc/server";
import { LaundryOrderClient } from "./laundry-order-client";

export const metadata: Metadata = {
  title: "Laundry Service | Cloudus",
  description:
    "Book laundry pickups with Cloudus. Share your pickup location, pay securely, and track progress in one place.",
};

export default async function LaundryPage() {
  const session = await auth();
  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    orderBy: [{ createdAt: "desc" }],
    take: 12,
    select: {
      id: true,
      name: true,
      city: true,
      suburb: true,
      pricePerKg: true,
    },
  });

  return (
    <HydrateClient>
      <main className="mx-auto max-w-5xl space-y-10 px-6 py-8">
        <section className="rounded-3xl border bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-blue-700">Laundry</p>
          <h1 className="text-3xl font-semibold text-gray-900">Pickup, wash, deliver.</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-700">
            Keep it simple: share your pickup details, choose the service, and pay securely. We confirm the supplier and
            drivers handle the rest.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">What's included</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>Wash, dry, fold, and optional pressing.</li>
              <li>Drivers collect and drop off at your preferred time.</li>
              <li>Updates for pickup, payment, and delivery milestones.</li>
            </ul>
            <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
              Weight entered here is an estimate. We confirm the final weight at the supplier and adjust billing if
              required.
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
              <li>Submit your pickup details.</li>
              <li>Pay securely to confirm.</li>
              <li>Track supplier assignment, pickup, and delivery.</li>
            </ol>
            <p className="mt-3 text-xs text-gray-500">
              Typical turnaround is 24-48 hours depending on service and weight.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Place a laundry order</h2>
          <p className="text-sm text-gray-600">
            We assign a supplier, confirm the final weight, and keep you updated throughout.
          </p>
          <div className="mt-6">
            <LaundryOrderClient defaultName={session?.user?.name} defaultEmail={session?.user?.email} />
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Suppliers</p>
              <h3 className="text-lg font-semibold text-gray-900">Laundry partners near you</h3>
            </div>
            <span className="text-xs font-semibold text-gray-500">{suppliers.length} partners</span>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {suppliers.length === 0 ? (
              <p className="text-sm text-gray-500">No suppliers listed yet.</p>
            ) : (
              suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="min-w-[180px] rounded-2xl border border-gray-100 bg-gray-50/60 p-3 text-sm text-gray-800 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-center text-base font-semibold uppercase text-white shadow-sm">
                      <span className="flex h-full items-center justify-center">
                        {(supplier.name ?? "Supplier").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{supplier.name}</p>
                      <p className="text-xs text-gray-500">
                        {[supplier.suburb, supplier.city].filter(Boolean).join(", ") || "Location pending"}
                      </p>
                    </div>
                  </div>
                  {supplier.pricePerKg ? (
                    <p className="mt-2 text-xs text-gray-600">
                      From {(supplier.pricePerKg / 100).toFixed(2)} per kg
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-600">Pricing on request</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </HydrateClient>
  );
}
