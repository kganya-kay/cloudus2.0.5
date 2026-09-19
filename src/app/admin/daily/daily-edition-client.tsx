"use client";

import { useState } from "react";

import { Button, Card, PageHeader } from "~/components/os/primitives";
import { SocialStoryFields } from "~/components/social/SocialStoryFields";
import type { SocialStoryMedia } from "~/components/social/types";
import { api } from "~/trpc/react";

export function DailyEditionClient() {
  const [title, setTitle] = useState("");
  const [dek, setDek] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [media, setMedia] = useState<SocialStoryMedia>({});
  const utils = api.useUtils();
  const edition = api.mediaPulse.listEdition.useQuery(undefined, { retry: false });
  const create = api.mediaPulse.createEdition.useMutation({
    onSuccess: async () => {
      setTitle("");
      setDek("");
      setSourceUrl("");
      setMedia({});
      await Promise.all([utils.mediaPulse.listEdition.invalidate(), utils.mediaPulse.frontpage.invalidate()]);
    },
  });
  const remove = api.mediaPulse.removeEdition.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.mediaPulse.listEdition.invalidate(), utils.mediaPulse.frontpage.invalidate()]);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Daily" actions={<Button href="/" variant="secondary">Home</Button>} />

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Load today</h2>
        <label className="text-xs text-os-muted">
          Title
          <input className="os-field" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="text-xs text-os-muted">
          Line
          <input className="os-field" value={dek} onChange={(event) => setDek(event.target.value)} />
        </label>
        <label className="text-xs text-os-muted">
          URL
          <input className="os-field" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" />
        </label>
        <SocialStoryFields value={media} onChange={setMedia} />
        <Button
          disabled={create.isPending || !title.trim() || (!media.imageUrl && !media.videoUrl && !media.audioUrl)}
          onClick={() =>
            create.mutate({
              title: title.trim(),
              dek: dek.trim() || undefined,
              sourceUrl: sourceUrl.trim() || undefined,
              imageUrl: media.imageUrl,
              videoUrl: media.videoUrl,
              audioUrl: media.audioUrl,
            })
          }
        >
          {create.isPending ? "…" : "Add"}
        </Button>
        {create.error ? <p className="text-sm text-os-danger">{create.error.message}</p> : null}
      </Card>

      <section className="space-y-3">
        {(edition.data ?? []).map((item) => (
          <Card key={item.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{item.title}</p>
              <p className="os-muted truncate">{item.dek}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => remove.mutate({ id: item.id })}
            >
              Remove
            </Button>
          </Card>
        ))}
        {!edition.data?.length ? <p className="os-muted">None today.</p> : null}
      </section>
    </div>
  );
}
