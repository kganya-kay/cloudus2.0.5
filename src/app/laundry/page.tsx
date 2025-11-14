import Link from "next/link";
import { Metadata } from "next";
import { LaundryOrderClient } from "./laundry-order-client";

export const metadata: Metadata = {
  title: "Laundry Service | Cloudus",
  description:
    "Book laundry pickups with Cloudus. Share your pickup location, pay securely, and track progress in one place.",
};

export default function LaundryPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <section className="rounded-3xl border bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-600">Cloudus laundry</p>
            <h1 className="text-3xl font-bold text-gray-900">Door-to-door laundry service</h1>
            <p className="mt-1 text-sm text-gray-600">
              Share your pickup details, confirm weight, and pay securely. We keep you updated at every step.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-700">
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Pickup & delivery</span>
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Pay online</span>
              <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">Live status alerts</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/70 p-4 text-sm text-gray-700 shadow-sm">
            <p className="font-semibold text-gray-900">Need help or bulk service?</p>
            <p className="text-xs text-gray-500">Chat to our team for recurring pickups, office laundry, or special care.</p>
            <Link
              href="https://wa.me/27640204765"
              target="_blank"
              className="mt-3 inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              WhatsApp support
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2" id="track">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">What's included</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li>�?� Wash, dry, fold, and optional pressing</li>
            <li>�?� Drivers collect and drop off at your preferred time</li>
            <li>�?� ETA and payment updates inside your dashboard</li>
          </ul>
          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
            Weight entered here is an estimate. We confirm the final weight at the supplier and adjust billing if required.
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
            <li>Submit the form with your pickup details.</li>
            <li>Pay securely online to confirm the booking.</li>
            <li>Track supplier assignment, driver pickup, and delivery.</li>
          </ol>
          <p className="mt-3 text-xs text-gray-500">
            Typical turnaround is 24-48 hours depending on selected service and weight.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Place a laundry order</h2>
        <p className="text-sm text-gray-600">We'll confirm your supplier and send updates as your order progresses.</p>
        <div className="mt-6">
          <LaundryOrderClient />
        </div>
      </section>
    </main>
  );
}
