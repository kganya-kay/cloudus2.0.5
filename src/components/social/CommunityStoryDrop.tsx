"use client";

import { useSession } from "next-auth/react";

import { BlogDump } from "~/components/blog/BlogDump";
import { Button, Card } from "~/components/os/primitives";

export function CommunityStoryDrop() {
  const { status } = useSession();

  if (status !== "authenticated") {
    return (
      <Card>
        <h2 className="text-lg font-semibold">Write</h2>
        <Button href="/auth/login?callbackUrl=/community" className="mt-4" size="sm">
          Sign in
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">Write</h2>
      <BlogDump compact showMedia />
    </Card>
  );
}
