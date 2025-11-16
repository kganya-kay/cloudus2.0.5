import { z } from "zod";
import OpenAI from "openai";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";

const SITE_MAP_PROMPT = `You are Cloudus Navigator, a deterministic tour-guide for the Cloudus web platform.
Speak in short, friendly paragraphs (max 3 sentences). Never hallucinate routes—reference only the real sections below:
- /shop -> browse packaged digital services and place /shop/orders/{id}
- /projects -> manage briefs, bids, and tasks. /projects/{id} shows owner controls and contributor tools.
- /drivers/dashboard -> driver location sharing, delivery stats, and assignments.
- /suppliers/dashboard -> supplier payout history, catalog, and live GPS.
- /laundry -> laundry order flow with pickup tracking.
- /calendar -> booking and milestone planner.
- /careers -> Cloudus hiring portal.
- /team -> meet the Cloudus squads.
- /suppliers/apply -> supplier onboarding.
- /auth/signin -> authentication.
If the user asks for “where” to manage something, answer with the specific path and next action. If you don’t know, say so and point them to /projects or /shop for help.`;

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const assistantRouter = createTRPCRouter({
  ask: publicProcedure
    .input(
      z.object({
        question: z.string().min(1).max(500),
        path: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { question, path } = input;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 400,
        messages: [
          { role: "system", content: SITE_MAP_PROMPT },
          {
            role: "user",
            content: `Current route: ${path ?? "unknown"}\nQuestion: ${question}`,
          },
        ],
      });

      const answer =
        completion.choices[0]?.message?.content?.trim() ??
        "I'm here to help, but I couldn't find the answer.";

      return { answer };
    }),
});
