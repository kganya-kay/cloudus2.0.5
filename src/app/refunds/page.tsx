"use client";

export default function RefundsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-sm leading-relaxed text-gray-800">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">Cloudus</p>
        <h1 className="text-2xl font-bold text-blue-700">Refund Policy</h1>
        <p className="text-xs text-gray-500">Last updated: March 2025</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">1) Eligibility</h2>
        <p>
          Refunds are available when an order or project milestone is not delivered as agreed, or
          if it is canceled before work starts. Once work has begun, partial refunds may apply to
          cover work already delivered and non-recoverable costs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">2) How to request</h2>
        <p>
          Contact support with your order or project reference, a brief description of the issue,
          and any evidence (e.g., delivery notes or messages). We aim to review within 5 business
          days and will coordinate with the supplier where relevant.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">3) Method of refund</h2>
        <p>
          Approved refunds are processed back to the original payment method via Paystack. Timing
          depends on your bank and Paystack's settlement windows.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">4) Non-refundable items</h2>
        <p>
          Fees for work already completed, custom or personalized goods already produced, and third
          party costs that cannot be recovered may be excluded from refunds.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">5) Contact</h2>
        <p>
          Email info@cloudusdigital.com or call 0640204765 to start a refund request.
        </p>
      </section>
    </main>
  );
}
