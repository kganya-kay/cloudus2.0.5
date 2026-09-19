"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, PageHeader } from "~/components/os/primitives";

type ChecklistItem = { id: string; label: string; done: boolean };

const defaultItems: ChecklistItem[] = [
  { id: "1", label: "20 min catch-up", done: false },
  { id: "2", label: "Choose one deliverable", done: false },
  { id: "3", label: "Build for two hours", done: false },
  { id: "4", label: "20 min demo", done: false },
  { id: "5", label: "Write the recap", done: false },
];

export default function StudioSessionPage() {
  const [seconds, setSeconds] = useState(2 * 60 * 60);
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState(defaultItems);
  const [deliverable, setDeliverable] = useState("");
  const [demo, setDemo] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const clock = useMemo(() => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hrs, mins, secs].map((part) => String(part).padStart(2, "0")).join(":");
  }, [seconds]);

  const recap = `Cloudus Build Night recap
Deliverable: ${deliverable || "Not named yet"}
Shipped checklist: ${items.filter((item) => item.done).length}/${items.length}
Demo: ${demo || "Add a one-line demo note"}
Next: invite two builders back next Friday.`;

  const copyRecap = async () => {
    try {
      await navigator.clipboard.writeText(recap);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Room"
        actions={<Button href="/events" variant="secondary">Events</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
        <Card className="text-center">
          <p className="os-kicker">Timer</p>
          <p className="mt-4 font-display text-5xl font-semibold tracking-tight">{clock}</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Start"}</Button>
            <Button variant="secondary" onClick={() => { setRunning(false); setSeconds(2 * 60 * 60); }}>
              Reset
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">List</h2>
          <ul className="mt-4 space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <label className="flex min-h-11 items-center gap-3 rounded-2xl bg-os-elevated px-4">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      setItems((current) =>
                        current.map((entry) =>
                          entry.id === item.id ? { ...entry, done: !entry.done } : entry,
                        ),
                      )
                    }
                  />
                  <span className={item.done ? "text-os-muted line-through" : ""}>{item.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Deliverable</h2>
          <input
            value={deliverable}
            onChange={(event) => setDeliverable(event.target.value)}
            placeholder="What ships"
            className="mt-4 w-full rounded-2xl border border-os-border bg-os-elevated px-4 py-3 text-sm outline-none"
          />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Demo</h2>
          <textarea
            value={demo}
            onChange={(event) => setDemo(event.target.value)}
            rows={3}
            placeholder="Note"
            className="mt-4 w-full rounded-2xl border border-os-border bg-os-elevated px-4 py-3 text-sm outline-none"
          />
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recap</h2>
          <Button onClick={() => void copyRecap()}>{copied ? "Copied" : "Copy"}</Button>
        </div>
        <pre className="os-muted mt-4 whitespace-pre-wrap font-sans text-sm">{recap}</pre>
      </Card>
    </div>
  );
}
