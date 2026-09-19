"use client";

import { useState } from "react";

import { Button, Card, PageHeader } from "~/components/os/primitives";
import { api } from "~/trpc/react";

export function DailyEditionClient() {
  const [note, setNote] = useState("");
  const utils = api.useUtils();
  const edition = api.mediaPulse.listEdition.useQuery(undefined, { retry: false });
  const desk = api.mediaPulse.desk.useQuery(undefined, { retry: false });
  const ingest = api.mediaPulse.ingest.useMutation({
    onSuccess: async () => {
      setNote("");
      await Promise.all([
        utils.mediaPulse.listEdition.invalidate(),
        utils.mediaPulse.frontpage.invalidate(),
        utils.mediaPulse.desk.invalidate(),
      ]);
    },
  });
  const pull = api.mediaPulse.pullDesk.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.mediaPulse.desk.invalidate(), utils.mediaPulse.frontpage.invalidate()]);
    },
  });
  const remove = api.mediaPulse.removeEdition.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.mediaPulse.listEdition.invalidate(), utils.mediaPulse.frontpage.invalidate()]);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily"
        hint="Paste a YouTube, eNCA, @channel, or a line like Diary of a CEO."
        actions={<Button href="/" variant="secondary">Home</Button>}
      />

      <Card className="space-y-4">
        <label className="text-xs text-os-muted">
          Feed
          <textarea
            className="os-field"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Diary of a CEO · eNCA · Mighti Jamie · https://…"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={ingest.isPending || !note.trim()}
            onClick={() => ingest.mutate({ note: note.trim() })}
          >
            {ingest.isPending ? "…" : "Add"}
          </Button>
          <Button
            variant="secondary"
            disabled={pull.isPending}
            onClick={() => pull.mutate()}
          >
            {pull.isPending ? "…" : "Pull desk"}
          </Button>
        </div>
        {ingest.error ? <p className="text-sm text-os-danger">{ingest.error.message}</p> : null}
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Today</h2>
        {(edition.data ?? []).map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{item.title}</p>
              <p className="os-muted truncate">{item.sourceName}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ id: item.id })}
            >
              Delete
            </Button>
          </Card>
        ))}
        {!edition.data?.length ? <p className="os-muted">None yet.</p> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Desk</h2>
        {(desk.data ?? []).map((item) => (
          <Card key={item.id} className="space-y-1">
            <p className="truncate font-semibold">{item.title}</p>
            <p className="os-muted truncate">{item.sourceName}</p>
          </Card>
        ))}
        {!desk.data?.length ? <p className="os-muted">Pull to load.</p> : null}
      </section>
    </div>
  );
}
