import Link from "next/link";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const highlights = [
  { label: "Delivery Ops", href: "/drivers/dashboard" },
  { label: "Supplier HQ", href: "/suppliers/dashboard" },
  { label: "Internal Careers", href: "/careers" },
  { label: "Client Calendar", href: "/calendar" },
];

export default function TechDest() {
  return (
    <section className="grid gap-6 md:grid-cols-2 md:items-center">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Experience Cloudus</p>
        <h3 className="text-2xl font-bold text-gray-900">
          Your technology destination: from marketplace orders to workforce portals.
        </h3>
        <p className="text-sm text-gray-600">
          Jump between live sections of the app to experience customer, supplier, driver, and team journeys.
          Every route is wired to real data. Remix the flows or plug your own services into our starter apps.
        </p>
        <div className="flex flex-wrap gap-2">
          {highlights.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-3">
          <Link
            href="/team"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Meet the team
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
          >
            Browse solutions
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-slate-100 p-6 shadow-inner">
        <DotLottieReact
          src="https://lottie.host/3db36f3f-8f2f-4fd4-b167-15012283243b/SNcCDNGGdL.lottie"
          loop
          autoplay
          style={{ width: 260, height: 260 }}
        />
      </div>
    </section>
  );
}
