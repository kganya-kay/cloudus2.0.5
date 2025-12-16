import Link from "next/link";

type PageProps = {
  params: { orderId?: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function PaymentSuccessPage({ params, searchParams }: PageProps) {
  const orderId = params.orderId ?? "";
  const refParam = searchParams?.reference || searchParams?.trxref;
  const reference = Array.isArray(refParam) ? refParam[0] : refParam;

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 text-center text-gray-800">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-blue-700">Payment received</h1>
      <p className="mt-2 text-sm text-gray-600">
        Thanks for your payment. We&apos;re confirming it and updating your order.
      </p>
      <div className="mt-4 space-y-1 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-left text-sm text-gray-700">
        <p>
          <span className="font-semibold text-gray-900">Order:</span>{" "}
          <span>{orderId || "N/A"}</span>
        </p>
        <p>
          <span className="font-semibold text-gray-900">Reference:</span>{" "}
          <span>{reference || "Not provided"}</span>
        </p>
      </div>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/shop/orders/${orderId || ""}`}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          View order
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back to shop
        </Link>
      </div>
    </main>
  );
}
