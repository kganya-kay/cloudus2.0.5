import { z } from "zod";

import { MEDIA_PULSE_KINDS } from "~/lib/media-pulse/kinds";
import { slugTopic, titleFromSlug } from "~/lib/media-pulse/topics";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { composeFrontpage } from "~/server/media-pulse/compose";

const kindSchema = z.enum(MEDIA_PULSE_KINDS);

export const mediaPulseRouter = createTRPCRouter({
  frontpage: publicProcedure
    .input(z.object({ kind: kindSchema.optional() }).optional())
    .query(async ({ ctx, input }) => composeFrontpage(ctx.db, input?.kind)),

  markInterest: publicProcedure
    .input(
      z.object({
        topic: z.string().trim().min(2).max(64),
        source: z.enum(["FILTER", "VIEW", "STORY"]).default("VIEW"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const topic = slugTopic(input.topic);
      if (!topic) return { ok: false as const };
      try {
        await ctx.db.topicInterest.create({
          data: {
            topic,
            label: titleFromSlug(topic),
            userId: ctx.session?.user?.id,
            source: input.source,
          },
        });
        return { ok: true as const };
      } catch {
        return { ok: false as const };
      }
    }),
});
