"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { api } from "~/trpc/react";

type Message = { role: "user" | "assistant"; text: string };

export function AssistantSearchBar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I’m the Cloudus guide. Ask how to manage suppliers, launch projects, or find any section.",
    },
  ]);

  const askMutation = api.assistant.ask.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again in a moment." },
      ]);
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    const text = query.trim();
    setMessages((prev) => [...prev, { role: "user", text }]);
    askMutation.mutate({ question: text, path: pathname ?? "/" });
    setQuery("");
  };

  return (
    <div className="space-y-3">
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
          placeholder="Ask Cloudus Navigator anything…"
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

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-inner">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Cloudus Navigator</p>
        <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-1 text-sm">
          {messages.map((message, idx) => (
            <div
              key={`${message.role}-${idx}`}
              className={`rounded-2xl px-3 py-2 ${
                message.role === "assistant"
                  ? "bg-white text-gray-700 shadow-sm"
                  : "bg-blue-600 text-white"
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Tip: ask “Where do I manage suppliers?” or “What’s next after bidding on a project?”
        </p>
      </div>
    </div>
  );
}
