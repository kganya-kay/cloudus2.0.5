import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    AUTH_URL: z.string().url().optional(),
    AUTH_DISCORD_ID: z.string(),
    AUTH_DISCORD_SECRET: z.string(),
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    STRIPE_PUBLISHABLE_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    STRIPE_WEBHOOK_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    OZOW_SITE_CODE: z.string().optional(),
    OZOW_API_URL: z.string().url().optional(),
    OZOW_API_KEY: z.string().optional(),
    OZOW_PRIVATE_KEY: z.string().optional(),
    OZOW_MODE: z.enum(["test", "live"]).default("test"),
    OPENAI_API_KEY:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
    AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    OZOW_SITE_CODE: process.env.OZOW_SITE_CODE,
    OZOW_API_URL: process.env.OZOW_API_URL,
    OZOW_API_KEY: process.env.OZOW_API_KEY,
    OZOW_PRIVATE_KEY: process.env.OZOW_PRIVATE_KEY,
    OZOW_MODE: process.env.OZOW_MODE,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
