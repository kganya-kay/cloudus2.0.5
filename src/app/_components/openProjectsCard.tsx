import Link from "next/link";

export default function OpenProjectsCard() {
  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-blue-500">Contribute</p>
          <h3 className="text-2xl font-semibold text-blue-900">15 open briefs need collaborators this month</h3>
          <p className="text-sm text-blue-900/70">
            Designers, engineers, suppliers, and operators can bid on project tasks, reserve budget, and request payouts
            once work is approved. Use this to build your portfolio or onboard your team.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-center shadow">
          <p className="text-sm font-semibold text-blue-900">Live briefs</p>
          <p className="text-3xl font-bold text-blue-600">15</p>
          <p className="text-xs uppercase tracking-wide text-blue-400">updated hourly</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/projects"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          View open projects
        </Link>
        <Link
          href="/projects/create"
          className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-white"
        >
          Post a new brief
        </Link>
        <Link
          href="/projects#bid"
          className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-white"
        >
          Learn how bidding works
        </Link>
      </div>
    </section>
  );
}
