import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";

import { TRPCReactProvider } from "~/trpc/react";
import { FloatingPortalLinks } from "./_components/FloatingPortalLinks";

export const metadata: Metadata = {
  title: "cloudus",
  description: "Cloudus Open Source, Our very own creative background",
  icons: [{ rel: "icon", url: "/logo" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full bg-gray-100`}>
      <body className="h-full">
        <SessionProvider>
          <TRPCReactProvider>
            {children}
            <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full bg-blue-50/80 px-3 py-2 shadow-lg ring-1 ring-blue-100 backdrop-blur">
              <img
                src="https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf"
                alt="Cloudus"
                className="h-8 w-8 rounded-full"
              />
              <Link href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-700">
                Cloudus
              </Link>
            </div>
          </TRPCReactProvider>
          <FloatingPortalLinks />
        </SessionProvider>
      </body>
    </html>
  );
}
