import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "cloudus",
  description: "Cloudus — launch digital products, automate ops, and scale service delivery.",
  icons: [{ rel: "icon", url: "/cloudus-logo-final.png" }],
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
