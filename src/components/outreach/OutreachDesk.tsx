"use client";

import { useState } from "react";

import { api } from "~/trpc/react";
import { CLOUDUS_SERVICES } from "~/lib/revenue/catalog";
import { Button, Card, EmptyState, PageHeader } from "~/components/os/primitives";

export function OutreachDesk() {
  const utils = api.useUtils();
  const snapshot = api.outreach.snapshot.useQuery(undefined, { retry: false });
  const queue = api.outreach.queue.useQuery(undefined, { retry: false });
  const campaigns = api.outreach.campaigns.useQuery(undefined, { retry: false });
  const runs = api.outreach.runs.useQuery(undefined, { retry: false });

  const fire = api.outreach.fire.useMutation({
    onSuccess: () => {
      void utils.outreach.queue.invalidate();
      void utils.outreach.snapshot.invalidate();
    },
  });
  const schedule = api.outreach.schedule.useMutation({
    onSuccess: () => void utils.outreach.queue.invalidate(),
  });
  const runToday = api.outreach.runToday.useMutation({
    onSuccess: () => {
      void utils.outreach.runs.invalidate();
      void utils.outreach.campaigns.invalidate();
      void utils.outreach.queue.invalidate();
    },
  });
  const createCampaign = api.outreach.createCampaign.useMutation({
    onSuccess: () => void utils.outreach.campaigns.invalidate(),
  });
  const discover = api.outreach.discover.useMutation({
    onSuccess: () => void utils.outreach.campaigns.invalidate(),
  });
  const pause = api.outreach.pauseCampaign.useMutation({
    onSuccess: () => void utils.outreach.campaigns.invalidate(),
  });
  const publish = api.outreach.publish.useMutation({
    onSuccess: () => void utils.outreach.queue.invalidate(),
  });
  const importLeads = api.outreach.importLeads.useMutation({
    onSuccess: () => void utils.outreach.campaigns.invalidate(),
  });

  const [city, setCity] = useState("Johannesburg");
  const [slug, setSlug] = useState<(typeof CLOUDUS_SERVICES)[number]["slug"]>("build");
  const [csv, setCsv] = useState("");
  const [campaignId, setCampaignId] = useState<string>("");

  const parseCsv = () =>
    csv
      .split(/\n+/)
      .map((line) => line.split(/[,;\t]/).map((part) => part.trim()))
      .filter((parts) => parts[0] && parts[1]?.includes("@"))
      .map((parts) => ({
        name: parts[0] ?? "Lead",
        email: parts[1] ?? "",
        company: parts[2],
      }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach"
        actions={
          <>
            <Button onClick={() => fire.mutate({})} disabled={fire.isPending}>
              Post
            </Button>
            <Button onClick={() => schedule.mutate()} disabled={schedule.isPending} variant="secondary">
              Schedule
            </Button>
            <Button onClick={() => runToday.mutate()} disabled={runToday.isPending} variant="ghost">
              Run
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {(snapshot.data?.channels ?? []).map((item) => (
          <Card key={item.channel}>
            <p className="os-kicker">{item.channel}</p>
            <p className="mt-2 text-sm">{item.ready ? "Live" : "Composer"}</p>
            <a className="mt-3 inline-block text-sm text-os-accent" href={item.composer} target="_blank" rel="noreferrer">
              Open
            </a>
          </Card>
        ))}
      </div>

      <Card>
        <p className="os-kicker">Queue</p>
        <div className="mt-3 space-y-3">
          {(queue.data ?? []).map((post) => (
            <div key={post.id} className="rounded-2xl bg-os-elevated p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold">
                  {post.channel} · {post.status}
                </p>
                {post.status !== "POSTED" ? (
                  <Button size="sm" variant="secondary" onClick={() => publish.mutate({ id: post.id })}>
                    Send
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{post.body}</p>
            </div>
          ))}
          {!queue.data?.length ? <EmptyState title="—" /> : null}
        </div>
      </Card>

      <Card>
        <p className="os-kicker">Campaign</p>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            createCampaign.mutate({ city, serviceSlug: slug });
          }}
        >
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="rounded-2xl border border-os-border bg-os-elevated px-4 py-3"
            aria-label="City"
          />
          <select
            value={slug}
            onChange={(event) => setSlug(event.target.value as typeof slug)}
            className="rounded-2xl border border-os-border bg-os-elevated px-4 py-3"
            aria-label="Service"
          >
            {CLOUDUS_SERVICES.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={createCampaign.isPending}>
            Discover
          </Button>
        </form>

        <textarea
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          className="mt-3 w-full rounded-2xl border border-os-border bg-os-elevated px-4 py-3"
          rows={3}
          placeholder="name,email,company"
          aria-label="Import"
        />
        <div className="mt-2 flex gap-2">
          <select
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
            className="rounded-2xl border border-os-border bg-os-elevated px-3 py-2 text-sm"
            aria-label="Campaign"
          >
            <option value="">Campaign</option>
            {(campaigns.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="secondary"
            disabled={!campaignId || importLeads.isPending}
            onClick={() =>
              importLeads.mutate({
                campaignId,
                rows: parseCsv(),
              })
            }
          >
            Import
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {(campaigns.data ?? []).map((campaign) => (
            <div key={campaign.id} className="rounded-2xl bg-os-elevated p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{campaign.name}</p>
                <p className="text-xs text-os-muted">
                  {campaign._count.leads} · {campaign._count.touches} · {campaign.status}
                </p>
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => discover.mutate({ campaignId: campaign.id })}>
                  Map
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    pause.mutate({
                      id: campaign.id,
                      status: campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                    })
                  }
                >
                  {campaign.status === "ACTIVE" ? "Pause" : "Live"}
                </Button>
              </div>
              {campaign.leads.length ? (
                <ul className="mt-2 text-sm">
                  {campaign.leads.map((lead) => (
                    <li key={lead.id}>
                      {lead.name} · {lead.interest} · {lead.score}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="os-kicker">Runs</p>
        <ul className="mt-3 space-y-2 text-sm">
          {(runs.data ?? []).map((run) => (
            <li key={run.id}>
              {run.ok ? "ok" : "fail"} · {new Date(run.startedAt).toISOString()}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
