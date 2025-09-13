// app/careers/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { jobs, getJobBySlug } from "./../../lib/jobs";
import Link from "next/link";

type Params = { slug: string };

export function generateStaticParams() {
  return jobs.map((j) => ({ slug: j.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const job = getJobBySlug(params.slug);
  if (!job) return { title: "Job not found – Cloudus Careers" };
  return {
    title: `${job.title} – Cloudus Careers`,
    description: job.summary
  };
}

export default function JobPage({ params }: { params: Params }) {
  const job = getJobBySlug(params.slug);
  if (!job) return notFound();

  const mailSubject = encodeURIComponent(`Application: ${job.title}`);
  const mailHref = `mailto:careers@cloudus.digital?subject=${mailSubject}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    employmentType: job.type,
    jobLocation: [{ "@type": "Place", address: job.location }],
    description: job.description,
    hiringOrganization: { "@type": "Organization", name: "Cloudus Digital" }
  };

  return (
    <main className="bg-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav className="mb-6 text-sm">
          <Link href="/careers" className="text-blue-700 hover:underline">
            ← Back to Careers
          </Link>
        </nav>

        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {job.type}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-500">{job.location}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {job.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
              >
                {t}
              </span>
            ))}
          </div>

          <p className="mt-6 text-gray-800">{job.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={mailHref}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Apply via Email
            </a>
            <Link
              href="/careers"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              View all roles
            </Link>
          </div>
        </div>
      </div>

      {/* SEO: JobPosting structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
