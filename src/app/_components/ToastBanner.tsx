// src/app/_components/ToastBanner.tsx
"use client";

import { useEffect, useState } from "react";

export default function ToastBanner({ message, variant = "info" }: { message: string; variant?: "info" | "warning" | "error" | "success" }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 4000);
    return () => clearTimeout(t);
  }, []);
  if (!open) return null;

  const colors: Record<string, string> = {
    info: "bg-blue-600",
    warning: "bg-amber-500",
    error: "bg-red-600",
    success: "bg-green-600",
  };

  return (
    <div className={`${colors[variant]} fixed left-1/2 top-4 z-[9999] -translate-x-1/2 rounded-full px-4 py-2 text-sm text-white shadow-lg`}
      role="status" aria-live="polite">
      {message}
      <button onClick={() => setOpen(false)} className="ml-3 rounded-full bg-black/20 px-2 py-0.5 text-xs">Dismiss</button>
    </div>
  );
}
