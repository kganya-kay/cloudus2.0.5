"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

import { PlayableMedia } from "~/components/media/PlayableMedia";
import { Button } from "~/components/os/primitives";
import { CameraLive } from "./CameraLive";
import { formatZarFromCents } from "~/lib/os/format";
import { api } from "~/trpc/react";

export type LiveScope = "EVENT" | "PROJECT" | "SESSION";

export function LiveStage({
  title,
  scope,
  scopeId,
  projectId,
  streamUrl,
  canHost,
  onSaveStream,
  savingStream,
}: {
  title: string;
  scope: LiveScope;
  scopeId: string;
  projectId?: number;
  streamUrl?: string | null;
  canHost?: boolean;
  onSaveStream?: (url: string) => void;
  savingStream?: boolean;
}) {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const [streamDraft, setStreamDraft] = useState(streamUrl ?? "");
  const [chatDraft, setChatDraft] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskZar, setTaskZar] = useState("");
  const utils = api.useUtils();

  const chat = api.live.chat.useQuery(
    { scope, scopeId },
    { retry: false, refetchInterval: 4000 },
  );
  const say = api.live.say.useMutation({
    onSuccess: async () => {
      setChatDraft("");
      await utils.live.chat.invalidate({ scope, scopeId });
    },
  });
  const tasks = api.project.tasks.useQuery(
    { projectId: projectId ?? 0 },
    { enabled: Boolean(projectId), retry: false, refetchInterval: 8000 },
  );
  const createTask = api.project.createTask.useMutation({
    onSuccess: async () => {
      setTaskTitle("");
      setTaskZar("");
      if (projectId) await utils.project.tasks.invalidate({ projectId });
    },
  });
  const bid = api.project.bid.useMutation({
    onSuccess: async () => {
      if (projectId) await utils.project.tasks.invalidate({ projectId });
    },
  });

  const openTasks = (tasks.data ?? []).filter((task) => !task.assignedToId && task.status === "BACKLOG");
  const liveUrl = streamUrl?.trim() || null;

  return (
    <section className="os-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <p className="os-kicker">Live</p>
          <h2 className="truncate text-lg font-semibold">{title}</h2>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${liveUrl ? "bg-os-burgundy text-[#f6edd9]" : "bg-os-elevated text-os-muted"}`}>
          {liveUrl ? "Link" : "Cam"}
        </span>
      </div>

      <div className="p-4">
        <CameraLive scope={scope} scopeId={scopeId} canHost={canHost} title={title} />
        {liveUrl ? (
          <div className="mt-3">
            <PlayableMedia videoUrl={liveUrl} title={title} featured />
          </div>
        ) : null}
      </div>

      {canHost && onSaveStream ? (
        <div className="flex gap-2 px-4 pb-4">
          <input
            className="os-field mt-0"
            placeholder="https://…"
            value={streamDraft}
            onChange={(event) => setStreamDraft(event.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!streamDraft.trim() || savingStream}
            onClick={() => onSaveStream(streamDraft.trim())}
          >
            {savingStream ? "…" : "Link"}
          </Button>
        </div>
      ) : null}

      {projectId ? (
        <div className="space-y-3 border-t border-os-border px-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pot</h3>
            <p className="text-xs text-os-muted">
              {formatZarFromCents(openTasks.reduce((sum, task) => sum + task.budgetCents, 0))}
            </p>
          </div>
          {canHost ? (
            <div className="flex flex-wrap gap-2">
              <input
                className="os-field mt-0 min-w-0 flex-1"
                placeholder="Task"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
              />
              <input
                className="os-field mt-0 w-24"
                placeholder="R"
                inputMode="numeric"
                value={taskZar}
                onChange={(event) => setTaskZar(event.target.value)}
              />
              <Button
                size="sm"
                disabled={!taskTitle.trim() || createTask.isPending}
                onClick={() =>
                  createTask.mutate({
                    projectId,
                    title: taskTitle.trim(),
                    budgetCents: Math.max(0, Math.round(Number(taskZar || 0) * 100)),
                  })
                }
              >
                {createTask.isPending ? "…" : "Offer"}
              </Button>
            </div>
          ) : null}
          {openTasks.length ? (
            <ul className="space-y-2">
              {openTasks.slice(0, 6).map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 rounded-2xl bg-os-elevated px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-os-muted">{formatZarFromCents(task.budgetCents)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!signedIn || bid.isPending}
                    onClick={() => bid.mutate({ projectId, taskIds: [task.id] })}
                  >
                    Bid
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="os-muted">No open tasks.</p>
          )}
          {bid.error ? <p className="text-sm text-os-danger">{bid.error.message}</p> : null}
        </div>
      ) : null}

      <div className="space-y-3 border-t border-os-border px-4 py-4">
        <h3 className="text-sm font-semibold">Room</h3>
        <ul className="max-h-56 space-y-2 overflow-y-auto">
          {(chat.data ?? []).map((item: { id: string; body: string; user: { name: string | null } }) => (
            <li key={item.id} className="rounded-2xl bg-os-elevated px-3 py-2">
              <p className="text-[11px] font-semibold">{item.user.name ?? "Member"}</p>
              <p className="text-sm">{item.body}</p>
            </li>
          ))}
          {!chat.data?.length ? <p className="os-muted">Quiet.</p> : null}
        </ul>
        {signedIn ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!chatDraft.trim()) return;
              say.mutate({ scope, scopeId, body: chatDraft.trim() });
            }}
          >
            <input
              className="os-field mt-0"
              placeholder="Say it"
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
            />
            <Button type="submit" size="sm" disabled={say.isPending}>
              Send
            </Button>
          </form>
        ) : (
          <Button href="/auth/login" size="sm">
            Sign in
          </Button>
        )}
      </div>
    </section>
  );
}
