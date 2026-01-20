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
import { SUPER_ADMIN_EMAILS } from "~/server/auth/super-admin";

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
  secret: env.AUTH_SECRET,

  // Switch to JWT sessions to avoid origin/cookie issues with database sessions
  session: { strategy: "jwt" },
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
      // Prefer the request host to avoid forcing cookies to the wrong origin
      const origin = (() => {
        try {
          return new URL(baseUrl).origin;
        } catch {
          return env.AUTH_URL ?? baseUrl;
        }
      })();

      if (url.startsWith("/")) return `${origin}${url}`;
      try {
        const target = new URL(url);
        return target.origin === origin ? url : origin;
      } catch {
        return origin;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id as string;
        token.role = (user as any).role ?? ("CUSTOMER" as RoleType);
        token.supplierId = (user as any).supplierId ?? null;
        token.email = user.email ?? token.email;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = (token.role as RoleType) ?? session.user.role;
        session.user.supplierId = (token.supplierId as string | null) ?? null;
      }
      // Ensure super admin always has ADMIN role
      const email = (token.email as string | null) ?? session.user?.email ?? null;
      const isSuper =
        !!email &&
        SUPER_ADMIN_EMAILS.includes(
          email.toLowerCase() as (typeof SUPER_ADMIN_EMAILS)[number],
        );
      if (isSuper && session.user) {
        session.user.role = Role.ADMIN;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
