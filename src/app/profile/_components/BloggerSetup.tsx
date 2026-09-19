"use client";

import { Button, Card } from "~/components/os/primitives";
import { SocialAccountCapture } from "~/components/social/SocialAccountCapture";
import { PLATFORM_LABELS, type SocialPlatformName } from "~/lib/social/platforms";
import { api } from "~/trpc/react";

export function BloggerSetup() {
  const accounts = api.social.listMine.useQuery(undefined, { retry: false });

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
        {(accounts.data ?? []).length > 0 ? (
          <ul className="space-y-2">
            {accounts.data?.map((account) => (
              <li key={account.id} className="rounded-2xl bg-os-elevated px-3 py-2 text-sm">
                {PLATFORM_LABELS[account.platform as SocialPlatformName]} @{account.handle}
                {account.isPrimary ? " · primary" : ""}
              </li>
            ))}
          </ul>
        ) : null}
        <SocialAccountCapture />
      </Card>
    </div>
  );
}
