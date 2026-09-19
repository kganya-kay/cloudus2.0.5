import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { Newsreader } from "next/font/google";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/lib/os/theme";
import { AppChrome } from "~/components/os/app-chrome";

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
    <html lang="en" className={`${GeistSans.variable} ${newsreader.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-os-bg text-os-fg">
        <SessionProvider>
          <TRPCReactProvider>
            <ThemeProvider>
              <AppChrome>{children}</AppChrome>
            </ThemeProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
