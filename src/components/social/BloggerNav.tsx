"use client";

import { useSession } from "next-auth/react";

import { Button } from "~/components/os/primitives";

export function BloggerNav({ current }: { current?: "community" | "mine" | "profile" }) {
  const { status } = useSession();
  const signedIn = status === "authenticated";

  return (
    <div className="flex flex-wrap gap-2">
      <Button href="/Blog" size="sm" variant={current === "community" ? "primary" : "secondary"}>
        All
      </Button>
      {signedIn ? (
        <>
          <Button href="/Blog/me" size="sm" variant={current === "mine" ? "primary" : "secondary"}>
            Mine
          </Button>
          <Button href="/profile" size="sm" variant={current === "profile" ? "primary" : "secondary"}>
            Profile
          </Button>
        </>
      ) : (
        <Button href="/auth/login?callbackUrl=/Blog/me" size="sm">
          Sign in
        </Button>
      )}
    </div>
  );
}
