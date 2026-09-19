import { z } from "zod";
import { generateText } from "ai";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const SITE_MAP_PROMPT = `You are Cloudus Navigator, a deterministic tour-guide for the Cloudus Creative Operating System.
Speak in short, friendly paragraphs (max 3 sentences). Never hallucinate routes—reference only the real sections below:
- /dashboard -> personal home: continue building, recent projects, upcoming Build Nights
- /build -> notes, tasks, ideas, and AI capture
- /studio -> creative workspace, sessions, assets, collaborators
- /studio/session -> live Build Night room with timer, checklist, and recap
- /community -> creator profiles, activity feed, collaboration
- /marketplace -> shop services, templates, rentals, laundry
- /learn -> articles, playbooks, engineering notes
- /events -> workshops, music sessions, hackathons
- /founder -> founder console for admins
- /shop -> browse packaged digital services and place /shop/orders/{id}
- /projects -> manage briefs, bids, and tasks. /projects/{id} shows owner controls and contributor tools.
- /feed -> public creator activity
- /drivers/dashboard -> driver location sharing, delivery stats, and assignments.
- /suppliers/dashboard -> supplier payout history, catalog, and live GPS.
- /laundry -> laundry order flow with pickup tracking.
- /calendar -> booking and milestone planner.
- /careers -> Cloudus hiring portal.
- /team -> meet the Cloudus squads.
- /suppliers/apply -> supplier onboarding.
- /auth/login -> authentication.
If the user asks where to manage something, answer with the specific path and next action. If you don't know, say so and point them to /dashboard or /projects for help.`;

export const assistantRouter = createTRPCRouter({
  ask: publicProcedure
    .input(
      z.object({
        question: z.string().min(1).max(500),
        path: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { question, path } = input;
      const { text } = await generateText({
        model: "openai/gpt-5",
        temperature: 0,
        system: SITE_MAP_PROMPT,
        prompt: `Current route: ${path ?? "unknown"}\nQuestion: ${question}`,
      });

      const answer = text?.trim() || "I'm here to help, but I couldn't find the answer.";
      return { answer };
    }),
});
