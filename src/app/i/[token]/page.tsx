"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { api } from "~/trpc/react";
import { Button, Card, PageHeader } from "~/components/os/primitives";

export default function InterestPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const lead = api.outreach.interest.useQuery({ token: token ?? "" }, { enabled: Boolean(token) });
  const mark = api.outreach.markInterest.useMutation();

  useEffect(() => {
    if (token) mark.mutate({ token, interest: "CLICKED" });
    // one mark on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <PageHeader title={lead.data?.campaign.name ?? "Cloudus"} />
      <Card>
        <p className="font-medium">{lead.data?.name}</p>
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => token && mark.mutate({ token, interest: "INTERESTED" })}
            disabled={mark.isPending}
          >
            Yes
          </Button>
          <Button href="/services" variant="secondary">
            Services
          </Button>
        </div>
        <Link href={`/i/${token}/stop`} className="mt-4 inline-block text-xs text-os-muted">
          Stop
        </Link>
      </Card>
    </div>
  );
}
