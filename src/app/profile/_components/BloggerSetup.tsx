"use client";

import { Button, Card } from "~/components/os/primitives";
import { SocialAccountCapture } from "~/components/social/SocialAccountCapture";

export function BloggerSetup() {
  return (
    <div className="mt-6 space-y-4">
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Blog</h2>
        <div className="flex flex-wrap gap-2">
          <Button href="/Blog/me" size="sm">
            Mine
          </Button>
          <Button href="/Blog" size="sm" variant="secondary">
            All
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Socials</h2>
        <SocialAccountCapture />
      </Card>
    </div>
  );
}
