import Link from "next/link";

export default function Video() {
  return (
    <section className="grid gap-4 rounded-3xl border bg-slate-950 p-6 text-white shadow-xl lg:grid-cols-2 lg:items-center">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Watch & learn</p>
        <h3 className="text-2xl font-semibold text-white">
          See how Cloudus stitches ordering, fulfilment, and payouts into a single customer journey.
        </h3>
        <p className="text-sm text-blue-100">
          This short walkthrough covers our shop, projects, laundry, careers, and driver portals. Use it to onboard
          your stakeholders or inspire the next sprint.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/projects"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
          >
            Explore live projects
          </Link>
          <Link
            href="/drivers/dashboard"
            className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Try driver portal
          </Link>
          <Link
            href="/suppliers/dashboard"
            className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Try supplier portal
          </Link>
        </div>
      </div>
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg">
        <iframe
          className="h-full w-full"
          src="https://www.youtube.com/embed/sQD7kaZ5h0s"
          title="Cloudus product walkthrough"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}
