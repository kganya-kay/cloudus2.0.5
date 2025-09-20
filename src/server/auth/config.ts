// src/server/auth-config.ts (or wherever your config lives)
import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { Role } from "@prisma/client";
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

declare module "next-auth" {
  interface JWT {
    id: string;
    role: Role;
    supplierId?: string | null;
  }
}

/* =========================
   NextAuth config
   ========================= */
export const authConfig = {
  adapter: PrismaAdapter(db),
  // Database sessions by default with PrismaAdapter (keep this)
  // session: { strategy: "database" },

  providers: [
    DiscordProvider,
    // add more providers here...
  ],

  callbacks: {
    // With database sessions, `user` is available here
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        // ensure these are present on the session for RBAC / supplier portal
        session.user.role = user.role ?? Role.CUSTOMER;
        session.user.supplierId = user.supplierId ?? null;
      }
      return session;
    },

    /* If you switch to JWT sessions later, uncomment this and set:
       session: { strategy: "jwt" },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? Role.CUSTOMER;
        token.supplierId = user.supplierId ?? null;
      }
      return token;
    },
    session: async ({ session, token }) => {
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
