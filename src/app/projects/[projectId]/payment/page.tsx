import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { ProjectPaymentClient } from "./payment-client";

type PageProps = {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<{ paymentId?: string }>;
};

export default async function ProjectPaymentPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams =
    searchParams !== undefined ? await Promise.resolve(searchParams) : undefined;

  const projectId = Number(resolvedParams.projectId);
  if (!Number.isFinite(projectId)) {
    notFound();
  }

  const session = await auth();
  if (!session) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/projects/${projectId}/payment`)}`);
  }

  const paymentData = await api.project.paymentPortal({ projectId });
  const highlightPaymentId =
    typeof resolvedSearchParams?.paymentId === "string"
      ? resolvedSearchParams.paymentId
      : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="space-y-2">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          &larr; Back to project
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">Project payments</h1>
        <p className="text-sm text-gray-600">
          Secure the deposit and track future payouts for this project inside the Cloudus payment
          portal.
        </p>
      </div>

      <ProjectPaymentClient
        project={paymentData.project}
        pendingPayment={paymentData.pendingPayment}
        payments={paymentData.payments}
        paidCents={paymentData.paidCents}
        preferences={paymentData.preferences}
        highlightPaymentId={highlightPaymentId}
      />
    </div>
  );
}
