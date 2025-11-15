import Link from "next/link";

const journeys = [
  {
    title: "Launch an online shop",
    description: "Sell services or digital products with instant payments and automated fulfilment.",
    href: "/shop",
  },
  {
    title: "Publish a portfolio project",
    description: "Showcase internal builds, open briefs, and invite collaborators on /projects.",
    href: "/projects",
  },
  {
    title: "Offer a managed service",
    description: "Use /laundry, /drivers/dashboard, and /suppliers/apply as templates for your own ops portals.",
    href: "/laundry",
  },
];

export default function GetWebApplication() {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-8 text-white shadow-xl lg:p-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-200">Cloudus platform</p>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Build, launch, and manage every customer touchpoint from one command centre.
          </h2>
          <p className="text-sm text-blue-100">
            Every route in this workspace is a working demo. Explore shop flows, project collaboration tools,
            driver and supplier portals, or career pipelines, then reuse them for your own organisation.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/projects/create"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-900 shadow hover:bg-blue-50"
            >
              Start a project
            </Link>
            <Link
              href="/calendar"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Book a strategy call
            </Link>
            <Link
              href="/careers"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Hire our team
            </Link>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl bg-white/5 p-6 shadow-inner backdrop-blur">
          <p className="text-sm font-semibold text-blue-100">Pick a starting point</p>
          <div className="space-y-4">
            {journeys.map((journey) => (
              <Link
                key={journey.title}
                href={journey.href}
                className="flex flex-col rounded-2xl border border-white/10 bg-blue-950/30 p-4 transition hover:border-white/40"
              >
                <span className="text-sm font-semibold text-white">{journey.title}</span>
                <span className="text-xs text-blue-200">{journey.description}</span>
              </Link>
            ))}
          </div>
          <div className="rounded-xl bg-slate-900/80 p-4 text-xs text-blue-100">
            Prefer a guided tour? Launch the product configurator below or chat to our team via the contact form.
          </div>
        </div>
      </div>
    </section>
  );
}
