// src/server/auth-config.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { Role as RoleType } from "@prisma/client";
import { Role } from "@prisma/client";
import DiscordProvider from "next-auth/providers/discord";
import { env } from "~/env";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { verifyPassword } from "./password";
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
  secret: env.AUTH_SECRET,

  // Use DB sessions so `session({ session, user })` has `user`
  session: { strategy: "database" },
  // Allow localhost and other hosts in development without requiring env
  // Prefer setting AUTH_URL and AUTH_TRUST_HOST in production environments
  trustHost: true,

  providers: [
    // Discord OAuth
    DiscordProvider({
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,
    }),
    // Credentials (email + password) custom auth
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        try {
          const creds = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(raw);
          if (!creds.success) return null;
          const { email, password } = creds.data;
          const user = await db.user.findUnique({ where: { email } });
          if (!user) return null;
          const u: any = user as any;
          if (!u || !u.passwordHash) return null;
          const ok = await verifyPassword(password, u.passwordHash as string);
          if (!ok) return null;
          return { id: user.id, name: user.name ?? null, email: user.email ?? null, role: user.role, supplierId: user.supplierId ?? null } as any;
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always resolve to configured AUTH_URL origin to avoid cross-domain cookies
      try {
        const target = new URL(env.AUTH_URL ?? baseUrl);
        if (url.startsWith("/")) return `${target.origin}${url}`;
        const u = new URL(url);
        if (u.origin === target.origin) return url;
        return target.origin;
      } catch {
        return baseUrl;
      }
    },
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
