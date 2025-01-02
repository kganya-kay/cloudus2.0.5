import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

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
       
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
