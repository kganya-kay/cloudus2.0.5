"use client";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-sm leading-relaxed text-gray-800">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">Cloudus</p>
        <h1 className="text-2xl font-bold text-blue-700">Terms of Service</h1>
        <p className="text-xs text-gray-500">Last updated: March 2025</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">1) What we do</h2>
        <p>
          Cloudus lets customers browse services, place orders, fund projects, and pay suppliers.
          We facilitate payments but do not take ownership of supplier deliverables.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">2) Accounts and eligibility</h2>
        <p>
          You must provide accurate contact details and keep your account secure. Business users
          are responsible for ensuring they are authorized to transact.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">3) Payments</h2>
        <p>
          Payments are processed via Paystack. Prices are shown in ZAR unless stated otherwise.
          You authorize us to charge the payment method you provide for orders, deposits, or
          supplier payouts.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">4) Cancellations and refunds</h2>
        <p>
          Refunds follow the Refund Policy. Where work has started, refunds may be partial to cover
          delivered work or non-recoverable costs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">5) Supplier responsibilities</h2>
        <p>
          Suppliers remain responsible for the quality, legality, and delivery of their services.
          Suppliers must honor timelines, communicate delays, and comply with local laws.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">6) Platform rules</h2>
        <p>
          No unlawful content, fraud, harassment, or IP infringement. We may suspend accounts that
          breach these terms or harm other users.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">7) Liability</h2>
        <p>
          To the extent allowed by law, Cloudus is not liable for indirect or consequential losses.
          Our total liability is limited to the fees you paid to us for the affected transaction.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">8) Contact</h2>
        <p>
          Questions? Email info@cloudusdigital.com or call 0640204765.
        </p>
      </section>
    </main>
  );
}
