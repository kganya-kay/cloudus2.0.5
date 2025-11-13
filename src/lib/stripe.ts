import Stripe from "stripe";

import { env } from "~/env";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY – set it in your environment.");
}

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
});
