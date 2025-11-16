"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { api } from "~/trpc/react";

const DEFAULT_PLACEHOLDER =
  "Ask Cloudus Navigator where to manage suppliers, launch projects, track laundry, etc.";

export function AssistantSearchBar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

  const askMutation = api.assistant.ask.useMutation({
    onSuccess: (data) => {
      setPlaceholder(data.answer);
      clearTimerAndScheduleReset();
    },
    onError: () => {
      setPlaceholder("Something went wrong. Try again in a moment.");
      clearTimerAndScheduleReset();
    },
  });

  const clearTimerAndScheduleReset = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setPlaceholder(DEFAULT_PLACEHOLDER);
    }, 8000);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    const text = query.trim();
    askMutation.mutate({ question: text, path: pathname ?? "/" });
    setQuery("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-stretch rounded-full border border-blue-200 bg-white shadow-sm transition focus-within:ring-2 focus-within:ring-blue-400"
    >
      <div className="flex items-center px-3 text-blue-600">
        <SparklesIcon className="h-5 w-5" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
      <button
        type="submit"
        disabled={askMutation.isPending}
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {askMutation.isPending ? "Thinking…" : "Ask"}
      </button>
    </form>
  );
}
