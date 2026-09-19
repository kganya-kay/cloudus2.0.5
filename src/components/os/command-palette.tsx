"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { commandRoutes } from "~/lib/os/nav";
import { api } from "~/trpc/react";

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const ask = api.assistant.ask.useMutation();

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commandRoutes.slice(0, 8);
    return commandRoutes
      .filter(
        (item) =>
          item.label.toLowerCase().includes(needle) ||
          item.description.toLowerCase().includes(needle) ||
          item.href.toLowerCase().includes(needle),
      )
      .slice(0, 8);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto mt-[12vh] w-full max-w-xl overflow-hidden rounded-3xl border border-os-border bg-os-card shadow-os">
        <label className="sr-only" htmlFor="os-command">
          Search Cloudus
        </label>
        <input
          id="os-command"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Go to a space, or ask Cloudus..."
          className="w-full border-b border-os-border bg-transparent px-5 py-4 text-base outline-none"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {matches.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                className="flex w-full flex-col rounded-2xl px-4 py-3 text-left hover:bg-os-elevated"
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
              >
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-xs text-os-muted">{item.description}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-os-border px-5 py-3">
          <button
            type="button"
            disabled={!query.trim() || ask.isPending}
            onClick={() => ask.mutate({ question: query, path: window.location.pathname })}
            className="text-xs font-semibold text-os-accent disabled:opacity-50"
          >
            {ask.isPending ? "Asking Navigator..." : "Ask Cloudus Navigator"}
          </button>
          {ask.data?.answer ? (
            <p className="mt-2 text-sm text-os-muted">{ask.data.answer}</p>
          ) : null}
          {ask.error ? (
            <p className="mt-2 text-sm text-os-danger">Navigator is unavailable right now.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
