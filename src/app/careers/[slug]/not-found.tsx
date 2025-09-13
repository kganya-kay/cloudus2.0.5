// app/careers/[slug]/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="text-2xl font-semibold">Job not found</h2>
      <p className="mt-2 text-gray-600">This role may have been filled or removed.</p>
      <Link href="/careers" className="mt-4 inline-block text-blue-700 hover:underline">
        Back to Careers
      </Link>
    </div>
  );
}
