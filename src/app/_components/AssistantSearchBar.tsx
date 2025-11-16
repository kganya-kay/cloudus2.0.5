"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { api } from "~/trpc/react";

const DEFAULT_PLACEHOLDER =
  "Ask Cloudus Navigator where to manage suppliers, launch projects, track laundry, etc.";

export function AssistantSearchBar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(true);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia("(max-width: 640px)");
    const apply = () => {
      const mobile = media.matches;
      setIsMobile(mobile);
      setExpanded(!mobile);
    };
    apply();
    const listener = () => apply();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
    } else {
      media.addListener(listener);
    }
    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, []);

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
    if (isMobile) {
      setExpanded(false);
    }
  };

  if (isMobile && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-max items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm"
      >
        <SparklesIcon className="h-4 w-4" />
        <span>Ask Cloudus</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center rounded-full border border-blue-200 bg-white shadow-sm transition focus-within:ring-2 focus-within:ring-blue-400 ${
        isMobile ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
      }`}
    >
      <div className={`flex items-center ${isMobile ? "px-1" : "px-2"} text-blue-600`}>
        <SparklesIcon className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-full border-0 bg-transparent outline-none placeholder:text-gray-400"
      />
      <button
        type="submit"
        disabled={askMutation.isPending}
        className={`rounded-full bg-blue-600 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 ${
          isMobile ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"
        }`}
      >
        {askMutation.isPending ? "Thinking…" : "Ask"}
      </button>
      {isMobile && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="ml-2 text-xs font-semibold text-gray-500"
        >
          Close
        </button>
      )}
    </form>
  );
}
