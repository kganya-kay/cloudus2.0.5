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
        <PageHeader title="Build" description="Loading your workspace." />
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
        eyebrow="Workspace"
        title="Build"
        description="Notion for thoughts. GitHub for shipping. Capture first, then turn it into a project, beat, or post."
        actions={<Button href="/projects/create">New project</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <p className="os-kicker">Quick capture</p>
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
            placeholder="A note, an idea, or the next task..."
            className="mt-4 w-full rounded-2xl border border-os-border bg-os-elevated px-4 py-3 text-sm outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-os-muted">{text.length}/500</p>
            <Button
              disabled={!text.trim() || capture.isPending || status !== "authenticated"}
              onClick={() => capture.mutate({ kind, text: text.trim() })}
            >
              {status !== "authenticated" ? "Sign in to save" : capture.isPending ? "Saving..." : "Capture"}
            </Button>
          </div>
          {capture.error ? <p className="mt-3 text-sm text-os-danger">Could not save. Check your session and try again.</p> : null}
        </Card>

        <Card>
          <p className="os-kicker">AI assistant</p>
          <h2 className="mt-2 text-lg font-semibold">Ask Cloudus Navigator</h2>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={4}
            placeholder="Where should I put a laundry order, a beat, or a project brief?"
            className="mt-4 w-full rounded-2xl border border-os-border bg-os-elevated px-4 py-3 text-sm outline-none"
          />
          <Button
            className="mt-3"
            variant="secondary"
            disabled={!question.trim() || assistant.isPending}
            onClick={() => assistant.mutate({ question, path: "/build" })}
          >
            {assistant.isPending ? "Thinking..." : "Ask"}
          </Button>
          {assistant.data?.answer ? <p className="os-muted mt-4">{assistant.data.answer}</p> : null}
          {assistant.error ? <p className="mt-3 text-sm text-os-danger">Assistant is unavailable.</p> : null}
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
            <EmptyState
              title="Your notebook is empty"
              description="Write the first note for Season One. This becomes content later."
            />
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Assigned tasks</h2>
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
            <EmptyState
              title="No tasks assigned"
              description="Claim work from the project marketplace or create a client brief."
              action={<Button href="/projects" size="sm">Find work</Button>}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
