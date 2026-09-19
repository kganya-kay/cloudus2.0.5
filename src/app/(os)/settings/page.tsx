"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "~/lib/os/theme";
import { Button, Card, PageHeader } from "~/components/os/primitives";

export default function SettingsPage() {
  const { data, status } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <Card>
        <h2 className="text-lg font-semibold">Theme</h2>
        <div className="mt-4 flex gap-2">
          <Button variant={theme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}>
            Light
          </Button>
          <Button variant={theme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}>
            Dark
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="os-muted mt-2">
          {status === "authenticated"
            ? `${data?.user?.name ?? "Member"} · ${data?.user?.email ?? ""}`
            : "Guest"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button href={data?.user?.email ? `/profile/${data.user.email}` : "/profile"} variant="secondary">
            Profile
          </Button>
          <Button href="/admin" variant="ghost">
            Admin
          </Button>
          <Button href={status === "authenticated" ? "/api/auth/signout" : "/auth/login"}>
            {status === "authenticated" ? "Sign out" : "Sign in"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
