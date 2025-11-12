// src/app/auth/login/page.tsx
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
    // Use a full redirect so cookies are set during navigation
    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
      redirect: true,
    });
    // If redirect is handled by NextAuth, code below won't run.
    setBusy(false);
    if ((res as any)?.error) setErr("Invalid email or password");
  };

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-2 text-2xl font-bold">Sign in</h1>
      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-3">
          <div>
            <label className="text-xs text-gray-600">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full rounded-full border px-3 py-2 text-sm" />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button onClick={submit} disabled={busy || !email || !password} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            onClick={() => signIn("discord", { callbackUrl: "/" })}
            className="rounded-full border px-4 py-2 text-sm"
          >
            Sign in with Discord
          </button>
          <p className="text-xs text-gray-600">No account? <Link href="/auth/register" className="text-blue-700 hover:underline">Register</Link></p>
        </div>
      </div>
    </main>
  );
}
