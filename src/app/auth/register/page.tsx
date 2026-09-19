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
        const j = await res.json().catch(() => ({})) as { error?: string };
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <p className="os-kicker">Cloudus OS</p>
      <h1 className="os-title mt-2">Create an account</h1>
      <p className="os-muted mt-2">Join as a builder. Existing registration and roles are unchanged.</p>
      <div className="os-card mt-6 p-5">
        <div className="grid gap-3">
          <div>
            <label className="text-xs text-os-muted" htmlFor="reg-name">Name</label>
            <input id="reg-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-full border border-os-border bg-os-elevated px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-os-muted" htmlFor="reg-email">Email</label>
            <input id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-full border border-os-border bg-os-elevated px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-os-muted" htmlFor="reg-password">Password</label>
            <input id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-full border border-os-border bg-os-elevated px-3 py-2 text-sm" />
          </div>
          {err && <p className="text-sm text-os-danger">{err}</p>}
          {msg && <p className="text-sm text-os-success">{msg}</p>}
          <button onClick={submit} disabled={busy || !name || !email || !password} className="min-h-11 rounded-full bg-os-fg px-4 py-2 text-sm font-semibold text-os-bg disabled:opacity-50 dark:bg-white dark:text-zinc-950">
            {busy ? "Registering…" : "Register"}
          </button>
          <p className="text-xs text-os-muted">Already have an account? <Link href="/auth/login" className="text-os-accent hover:underline">Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}
