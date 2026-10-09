"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

import { api } from "~/trpc/react";
import { PageHeader } from "~/components/os/primitives";

export default function StopPage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const mark = api.outreach.markInterest.useMutation();

  useEffect(() => {
    if (token) mark.mutate({ token, interest: "UNSUBSCRIBED" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto max-w-lg py-10">
      <PageHeader title="Stopped" />
    </div>
  );
}
