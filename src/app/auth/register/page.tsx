// src/app/auth/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error ?? "Registration failed");
      } else {
        setMsg("Registration successful. You can sign in now.");
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-2 text-2xl font-bold">Register</h1>
      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-3">
          <div>
            <label className="text-xs text-gray-600">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-700">{msg}</p>}
          <button onClick={submit} disabled={busy || !name || !email || !password} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Registering…" : "Register"}
          </button>
          <p className="text-xs text-gray-600">Already have an account? <Link href="/auth/login" className="text-blue-700 hover:underline">Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}

