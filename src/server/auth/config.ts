// src/server/auth-config.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { Role as RoleType } from "@prisma/client";
import { Role } from "@prisma/client";
import DiscordProvider from "next-auth/providers/discord";
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
const SUPER_ADMIN_EMAIL = "kganyakekana@gmail.com" as const;

export const authConfig = {
  adapter: PrismaAdapter(db),

  // Use DB sessions so `session({ session, user })` has `user`
  session: { strategy: "database" },
  // Allow localhost and other hosts in development without requiring env
  // Prefer setting AUTH_URL and AUTH_TRUST_HOST in production environments
  trustHost: true,

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
        // Ensure super admin always has ADMIN role and full access
        const email = user.email ?? session.user.email ?? null;
        const isSuper = !!email && email.toLowerCase() === SUPER_ADMIN_EMAIL;
        session.user.role = isSuper ? Role.ADMIN : (user.role ?? ("CUSTOMER" as RoleType));
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
