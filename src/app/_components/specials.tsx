import Link from "next/link";
import Image from "next/image";

export default function Special() {
  // ---- Contact CTAs ----
  const salesEmail = "info@cloudusdigital.com";
  const emailHref = `mailto:${salesEmail}?subject=${encodeURIComponent(
    "Web Application Enquiry"
  )}`;

  // WhatsApp requires country code and no leading 0: +27 64 020 4765 -> 27640204765
  const whatsappNumberE164 = "27640204765";
  const whatsappText = encodeURIComponent(
    "Hi Cloudus, I'm interested in a web application for my business. Can you help?"
  );
  const whatsappHref = `https://wa.me/${whatsappNumberE164}?text=${whatsappText}`;

  return (
    <div className="bg-white relative -z-11">
      <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 pt-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
          <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -z-10 size-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
          >
            <circle
              r={512}
              cx={512}
              cy={512}
              fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
              fillOpacity="0.7"
            />
            <defs>
              <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                <stop stopColor="#7775D6" />
                <stop offset={1} stopColor="#E935C1" />
              </radialGradient>
            </defs>
          </svg>

          <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-16 lg:text-left">
            <p className="text-xs uppercase tracking-[0.5em] text-rose-200">Featured launch</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Launch a branded web experience with Cloudus.
            </h2>
            <p className="mt-6 text-pretty text-sm text-gray-300">
              Bundle storefronts from /shop, fulfilment from /drivers/dashboard, and collaboration from /projects
              into a single deployment. We plug into your existing billing and support stack.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {/* Internal CTA */}
              <Link
                href="/shop/orders/2"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started
              </Link>

              {/* Email Sales */}
              <a
                href={emailHref}
                className="rounded-md border border-white/30 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Email sales at Cloudus Digital"
              >
                Email Sales
              </a>

              {/* WhatsApp */}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
                aria-label="Chat with Cloudus Digital on WhatsApp"
              >
                WhatsApp Us
              </a>
              <Link
                href="/projects"
                className="rounded-md border border-white/30 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Browse live builds
              </Link>
              <Link
                href="/laundry"
                className="rounded-md border border-white/30 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                See service portals
              </Link>
            </div>
          </div>

          <div className="relative mt-16 h-80 lg:mt-20">
            <Image
              alt="App screenshot"
              src="https://utfs.io/f/zFJP5UraSTwKwlar0j7FNcaSY213do5B9V4M86IGzyjZTAeJ"
              width={384}
              height={320}
              className="w-96 h-80 rounded-md bg-white/5 ring-1 ring-white/10 object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
