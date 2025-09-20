// app/careers/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { jobs, getJobBySlug } from "../../lib/jobs";
import Link from "next/link";

type Params = { slug: string };

// prebuild slugs (ok to keep)
export function generateStaticParams(): { slug: string }[] {
  return jobs.map((j) => ({ slug: j.slug }));
}

// metadata with async params
export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const { slug } =  params;
  const job = getJobBySlug(slug);
  return job
    ? { title: `${job.title} – Cloudus Careers`, description: job.summary }
    : { title: "Job not found – Cloudus Careers" };
}

// page with async params
export default async function JobPage(
  { params }: { params: Params }
) {
  const { slug } = params;
  const job = getJobBySlug(slug);
  if (!job) return notFound();

  // ---- Contact CTAs ----
  const applicantEmail = "careers@cloudusdigital.com";
  const mailSubject = encodeURIComponent(`Application: ${job.title}`);
  const mailHref = `mailto:${applicantEmail}?subject=${mailSubject}`;

  // WhatsApp requires country code and no leading 0 → +27 64 020 4765 → 27640204765
  const whatsappNumberE164 = "27640204765";
  const whatsappText = encodeURIComponent(
    `Hi Cloudus, I am applying for ${job.title}. Is this role still open?`
  );
  const whatsappHref = `https://wa.me/${whatsappNumberE164}?text=${whatsappText}`;

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
              <span key={t} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700">
                {t}
              </span>
            ))}
          </div>

          <p className="mt-6 text-gray-800">{job.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {/* Email apply */}
            <a
              href={mailHref}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Apply via Email
            </a>

            {/* WhatsApp contact */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-green-600 px-4 py-2 text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Chat on WhatsApp
            </a>

            <Link
              href="/careers"
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              View all roles
            </Link>
          </div>

          {/* Optional plain text contacts for accessibility/SEO */}
          <p className="mt-4 text-sm text-gray-600">
            Prefer email? Contact us at{" "}
            <a href={`mailto:${applicantEmail}`} className="text-blue-700 hover:underline">
              {applicantEmail}
            </a>{" "}
            or WhatsApp at{" "}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-700 hover:underline"
            >
              064&nbsp;020&nbsp;4765
            </a>
            .
          </p>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
