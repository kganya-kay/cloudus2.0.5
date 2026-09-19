"use client";

import { Button, Card } from "~/components/os/primitives";
import { SocialAccountCapture } from "~/components/social/SocialAccountCapture";
import { PLATFORM_LABELS, type SocialPlatformName } from "~/lib/social/platforms";
import { api } from "~/trpc/react";

export function BloggerSetup() {
  const mine = api.blog.mine.useQuery(undefined, { retry: false });
  const accounts = api.social.listMine.useQuery(undefined, { retry: false });

  return (
    <div className="mt-6 space-y-4">
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Your blog</h2>
        <p className="os-muted">
          {mine.data?.blog
            ? `Stories live at /Blog/${mine.data.blog.userName}. The public list stays open.`
            : "Open your blog to start a public story page. You can still read everyone else."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button href="/Blog/me" size="sm">
            My stories
          </Button>
          <Button href="/Blog" size="sm" variant="secondary">
            Public blogs
          </Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">Social accounts</h2>
        <p className="os-muted">
          Capture one social here. After that, Drop latest can fetch your newest public post in the background.
        </p>
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
