"use client";

import { usePathname } from "next/navigation";
import { OsShell } from "./shell";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }
  return <OsShell>{children}</OsShell>;
}
