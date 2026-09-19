"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: true,
    });
    setBusy(false);
    if ((res as { error?: string } | undefined)?.error) setErr("Invalid email or password");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <p className="os-kicker">Cloudus OS</p>
      <h1 className="os-title mt-2">Sign in</h1>
      <p className="os-muted mt-2">Same Cloudus account. The operating system is the new front door.</p>
      <div className="os-card mt-6 p-5">
        <div className="grid gap-3">
          <div>
            <label className="text-xs text-os-muted" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-full border border-os-border bg-os-elevated px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-os-muted" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-full border border-os-border bg-os-elevated px-3 py-2 text-sm"
            />
          </div>
          {err && <p className="text-sm text-os-danger">{err}</p>}
          <button
            onClick={submit}
            disabled={busy || !email || !password}
            className="min-h-11 rounded-full bg-os-fg px-4 py-2 text-sm font-semibold text-os-bg disabled:opacity-50 dark:bg-white dark:text-zinc-950"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
            className="min-h-11 rounded-full border border-os-border px-4 py-2 text-sm"
          >
            Sign in with Discord
          </button>
          <p className="text-xs text-os-muted">
            No account? <Link href="/auth/register" className="text-os-accent hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
