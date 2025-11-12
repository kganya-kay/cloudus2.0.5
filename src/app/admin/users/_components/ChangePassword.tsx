// src/app/admin/users/_components/ChangePassword.tsx
"use client";

import { useState } from "react";

export default function ChangePassword({ userId }: { userId: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSave = async () => {
    setBusy(true); setMsg(null); setErr(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error ?? "Failed to update password");
      } else {
        setMsg("Password updated and sessions invalidated.");
        setPassword("");
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border p-3">
      <h3 className="mb-2 text-sm font-semibold">Set New Password</h3>
      <div className="flex gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full rounded-full border px-3 py-2 text-sm"
        />
        <button
          onClick={onSave}
          disabled={busy || password.length < 6}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-green-700">{msg}</p>}
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      <p className="mt-2 text-xs text-gray-600">Min 6 characters. User will be logged out everywhere.</p>
    </div>
  );
}

