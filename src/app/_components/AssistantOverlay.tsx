"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { XMarkIcon, SparklesIcon } from "@heroicons/react/24/outline";

import { api } from "~/trpc/react";

type TaxonomyItem = { label: string; description: string; href: string };

const DEFAULT_TAXONOMY: TaxonomyItem[] = [
  { label: "Feed", description: "Latest creator drops, launch recaps, and payout stats.", href: "/feed" },
  { label: "Projects", description: "Source briefs, tasks, and contributors.", href: "/projects" },
  { label: "Suppliers", description: "Manage fulfilment partners and payouts.", href: "/suppliers/dashboard" },
  { label: "Drivers", description: "Share live locations, accept deliveries, and track payouts.", href: "/drivers/dashboard" },
  { label: "Shop", description: "Productized services, instant ordering, and configurators.", href: "/shop" },
];

export function AssistantOverlay({
  taxonomy = DEFAULT_TAXONOMY,
}: {
  taxonomy?: TaxonomyItem[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  const askMutation = api.assistant.ask.useMutation({
    onSuccess: (data) => {
      setAnswer(data.answer);
    },
    onError: () => {
      setAnswer("Navigator ran into an issue. Try rephrasing or ask again in a moment.");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;
    askMutation.mutate({ question: question.trim(), path: pathname ?? "/" });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-full max-w-sm rounded-3xl border border-blue-200 bg-white/95 p-4 text-sm text-gray-700 shadow-2xl dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-300">Cloudus Navigator</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Answers reference the feed taxonomy below.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gray-100 p-1 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-3 space-y-2">
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Where do I manage suppliers?"
              className="w-full rounded-2xl border border-blue-100 px-3 py-2 text-sm outline-none focus:border-blue-300 dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="submit"
              disabled={askMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <SparklesIcon className="h-4 w-4" />
              {askMutation.isPending ? "Thinking..." : "Ask Navigator"}
            </button>
          </form>
          <div className="mt-4 rounded-2xl border border-dashed border-blue-100 p-3 text-xs text-gray-600 dark:border-slate-700 dark:text-slate-300">
            {answer ? (
              answer
            ) : (
              "Navigator references the feed taxonomy and your current page to answer onboarding questions."
            )}
          </div>
          <div className="mt-4 space-y-2">
            {taxonomy.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-gray-100 px-3 py-2 text-xs hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-400"
              >
                <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-gray-500 dark:text-slate-300">{item.description}</p>
              </a>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
      >
        <SparklesIcon className="h-5 w-5" />
        Ask Cloudus
      </button>
    </div>
  );
}
