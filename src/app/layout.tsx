import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/lib/os/theme";
import { LegacyChrome } from "./_components/LegacyChrome";

export const metadata: Metadata = {
  title: "Cloudus OS",
  description:
    "Cloudus is the creative operating system for African builders — software, music, community, and service delivery under one roof.",
  icons: [{ rel: "icon", url: "/cloudus-logo-final.png" }],
};

const themeScript = `
try {
  var stored = localStorage.getItem("cloudus-theme");
  var dark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-os-bg text-os-fg">
        <SessionProvider>
          <TRPCReactProvider>
            <ThemeProvider>
              {children}
              <LegacyChrome />
            </ThemeProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
