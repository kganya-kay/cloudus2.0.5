"use client";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-sm leading-relaxed text-gray-800">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">Cloudus</p>
        <h1 className="text-2xl font-bold text-blue-700">Privacy Policy</h1>
        <p className="text-xs text-gray-500">Last updated: March 2025</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">1) Information we collect</h2>
        <p>
          We collect contact details, order/project information, and payment-related metadata.
          Payments are processed by Paystack; we do not store full card details.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">2) How we use data</h2>
        <p>
          To operate the platform, process payments, prevent fraud, support users, and improve
          services. We may send service emails (order updates, invoices); you can opt out of
          non-essential marketing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">3) Sharing</h2>
        <p>
          We share data with service providers (hosting, payments, analytics) under confidentiality
          terms. We may share relevant details with suppliers to deliver your orders.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">4) Security</h2>
        <p>
          We use encryption in transit and role-based access. No system is perfect; protect your
          credentials and notify us of suspected misuse.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">5) Retention</h2>
        <p>
          We keep data while your account is active and as needed for legal, accounting, and fraud
          prevention purposes.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">6) Your choices</h2>
        <p>
          You can request access, correction, or deletion of your data where allowed by law.
          Contact us to make these requests.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">7) Contact</h2>
        <p>
          Email kganyakekana@gmail.com or call 0640204765.
        </p>
      </section>
    </main>
  );
}
