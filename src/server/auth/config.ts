// src/server/auth-config.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { Role } from "@prisma/client"; // type-only
import { db } from "~/server/db";

/* =========================
   Type augmentation
   ========================= */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
      supplierId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    supplierId?: string | null;
  }
}


/* =========================
   NextAuth config (Auth.js v5)
   ========================= */
export const authConfig = {
  adapter: PrismaAdapter(db),

  // Use DB sessions so `session({ session, user })` has `user`
  session: { strategy: "database" },

  providers: [
    // You can also call with explicit env if you prefer:
    // DiscordProvider({ clientId: process.env.AUTH_DISCORD_ID!, clientSecret: process.env.AUTH_DISCORD_SECRET! })
    DiscordProvider,
  ],

  callbacks: {
    // With database sessions, `user` is always available here
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? ("CUSTOMER" as Role);
        session.user.supplierId = user.supplierId ?? null;
      }
      return session;
    },

    // If you ever switch to JWT sessions:
    // 1) set session: { strategy: "jwt" }
    // 2) uncomment both callbacks below
    /*
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? ("CUSTOMER" as Role);
        token.supplierId = user.supplierId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.supplierId = (token.supplierId as string | null) ?? null;
      }
      return session;
    },
    */
  },
} satisfies NextAuthConfig;
