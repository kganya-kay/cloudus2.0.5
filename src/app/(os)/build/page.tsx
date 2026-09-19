"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { parseCapture } from "~/lib/os/format";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  OfflineBanner,
  PageHeader,
  SkeletonGrid,
} from "~/components/os/primitives";
import { useOnline } from "../_components/use-online";

const kinds = ["NOTE", "IDEA", "TASK"] as const;

export default function BuildPage() {
  const { status } = useSession();
  const online = useOnline();
  const [kind, setKind] = useState<(typeof kinds)[number]>("NOTE");
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const overview = api.workspace.overview.useQuery(undefined, { retry: false });
  const utils = api.useUtils();
  const capture = api.workspace.capture.useMutation({
    onSuccess: async () => {
      setText("");
      await Promise.all([utils.workspace.overview.invalidate(), utils.workspace.captures.invalidate()]);
    },
  });
  const assistant = api.assistant.ask.useMutation();

  const captures = useMemo(
    () => (overview.data?.captures ?? []).map((item) => ({ ...item, ...parseCapture(item.name) })),
    [overview.data?.captures],
  );

  if (overview.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Build" />
        <SkeletonGrid />
      </div>
    );
  }

  if (overview.error) {
    return <ErrorState onRetry={() => void overview.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <OfflineBanner online={online} />
      <PageHeader
        title="Build"
        actions={<Button href="/projects/create">New</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <p className="os-kicker">Capture</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {kinds.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKind(item)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  kind === item ? "bg-os-fg text-os-bg dark:bg-white dark:text-zinc-950" : "bg-os-elevated text-os-muted"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Note"
            className="mt-4 w-full rounded-2xl border border-os-border bg-os-elevated px-4 py-3 text-sm outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-os-muted">{text.length}/500</p>
            <Button
              disabled={!text.trim() || capture.isPending || status !== "authenticated"}
              onClick={() => capture.mutate({ kind, text: text.trim() })}
            >
              {status !== "authenticated" ? "Sign in" : capture.isPending ? "…" : "Save"}
            </Button>
          </div>
          {capture.error ? <p className="mt-3 text-sm text-os-danger">Failed.</p> : null}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Ask</h2>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={4}
            placeholder="Ask Cloudus"
            className="mt-4 w-full rounded-2xl border border-os-border bg-os-elevated px-4 py-3 text-sm outline-none"
          />
          <Button
            className="mt-3"
            variant="secondary"
            disabled={!question.trim() || assistant.isPending}
            onClick={() => assistant.mutate({ question, path: "/build" })}
          >
            {assistant.isPending ? "…" : "Ask"}
          </Button>
          {assistant.data?.answer ? <p className="os-muted mt-4">{assistant.data.answer}</p> : null}
          {assistant.error ? <p className="mt-3 text-sm text-os-danger">Failed.</p> : null}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Captures</h2>
          {captures.length ? (
            <ul className="mt-4 space-y-3">
              {captures.map((item) => (
                <li key={item.id} className="rounded-2xl bg-os-elevated px-4 py-3">
                  <Badge tone={item.kind === "TASK" ? "warning" : item.kind === "IDEA" ? "accent" : "default"}>
                    {item.kind}
                  </Badge>
                  <p className="mt-2 text-sm">{item.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Empty" />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <Button href="/projects" size="sm" variant="ghost">
              Projects
            </Button>
          </div>
          {overview.data?.assignedTasks.length ? (
            <ul className="mt-4 space-y-3">
              {overview.data.assignedTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 rounded-2xl bg-os-elevated px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="os-muted">{task.project.name}</p>
                  </div>
                  <Button href={`/projects/${task.project.id}`} size="sm" variant="secondary">
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="None" action={<Button href="/projects" size="sm">Projects</Button>} />
          )}
        </Card>
      </div>
    </div>
  );
}
