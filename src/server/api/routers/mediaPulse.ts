import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { MEDIA_PULSE_KINDS } from "~/lib/media-pulse/kinds";
import { editionBounds, editionKey, pickLiveMedia } from "~/lib/media-pulse/media";
import { slugTopic, titleFromSlug } from "~/lib/media-pulse/topics";
import { resolveDeskNote } from "~/lib/media-pulse/sources";
import { caretakerProcedure } from "~/server/api/rbac";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { composeFrontpage } from "~/server/media-pulse/compose";
import { clearWireCache, collectWireStories } from "~/server/media-pulse/wire";

const kindSchema = z.enum(MEDIA_PULSE_KINDS);

export const mediaPulseRouter = createTRPCRouter({
  frontpage: publicProcedure
    .input(z.object({ kind: kindSchema.optional() }).optional())
    .query(async ({ ctx }) => composeFrontpage(ctx.db)),

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

  listEdition: caretakerProcedure.query(async ({ ctx }) => {
    const { start, end } = editionBounds();
    return ctx.db.mediaPulseStory.findMany({
      where: {
        origin: "ADMIN",
        OR: [{ pinned: true }, { editionDate: { gte: start, lt: end } }],
      },
      orderBy: [{ pinned: "desc" }, { fetchedAt: "desc" }],
    });
  }),

  createEdition: caretakerProcedure
    .input(
      z.object({
        title: z.string().trim().min(2).max(120),
        dek: z.string().trim().max(240).optional(),
        sourceUrl: z.string().trim().url().optional(),
        imageUrl: z.string().trim().url().optional(),
        videoUrl: z.string().trim().url().optional(),
        audioUrl: z.string().trim().url().optional(),
        kind: kindSchema.optional(),
        pinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const media = pickLiveMedia(input);
      if (!media) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Need live media." });
      }
      const kind =
        input.kind ??
        (media.videoUrl ? "VIDEO" : media.audioUrl ? "SONG" : "PHOTO");
      const day = editionKey();
      const now = new Date();
      return ctx.db.mediaPulseStory.create({
        data: {
          topic: `daily-${day}`,
          kind,
          title: input.title,
          dek: input.dek || input.title,
          sourceName: "Daily",
          sourceUrl: input.sourceUrl || `/#daily-${now.getTime()}`,
          imageUrl: media.imageUrl,
          videoUrl: media.videoUrl,
          audioUrl: media.audioUrl,
          origin: "ADMIN",
          pinned: input.pinned ?? false,
          editionDate: now,
          score: 160,
          expiresAt: new Date(now.getTime() + 36 * 60 * 60 * 1000),
        },
      });
    }),

  removeEdition: caretakerProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mediaPulseStory.delete({ where: { id: input.id } });
      return { ok: true as const };
    }),

  desk: caretakerProcedure.query(async () => {
    return collectWireStories();
  }),

  pullDesk: caretakerProcedure.mutation(async () => {
    clearWireCache();
    return collectWireStories(true);
  }),

  ingest: caretakerProcedure
    .input(
      z.object({
        note: z.string().trim().min(2).max(500),
        pinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const found = await resolveDeskNote(input.note);
      const picked = found.filter((item) => pickLiveMedia(item));
      if (!picked.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Nothing live for that." });
      }
      const day = editionKey();
      const now = new Date();
      const created = [];
      for (const [index, item] of picked.slice(0, 3).entries()) {
        const media = pickLiveMedia(item)!;
        const kind = item.videoUrl ? "VIDEO" : item.kind;
        created.push(
          await ctx.db.mediaPulseStory.upsert({
            where: {
              topic_kind_sourceUrl: {
                topic: `daily-${day}`,
                kind,
                sourceUrl: item.sourceUrl,
              },
            },
            update: {
              title: item.title,
              dek: item.dek || item.title,
              sourceName: item.sourceName,
              imageUrl: media.imageUrl,
              videoUrl: media.videoUrl,
              audioUrl: media.audioUrl,
              pinned: input.pinned ?? index === 0,
              editionDate: now,
              score: 180 - index * 4,
              expiresAt: new Date(now.getTime() + 36 * 60 * 60 * 1000),
            },
            create: {
              topic: `daily-${day}`,
              kind,
              title: item.title,
              dek: item.dek || item.title,
              sourceName: item.sourceName,
              sourceUrl: item.sourceUrl,
              imageUrl: media.imageUrl,
              videoUrl: media.videoUrl,
              audioUrl: media.audioUrl,
              origin: "ADMIN",
              pinned: input.pinned ?? index === 0,
              editionDate: now,
              score: 180 - index * 4,
              expiresAt: new Date(now.getTime() + 36 * 60 * 60 * 1000),
            },
          }),
        );
      }
      clearWireCache();
      return created;
    }),
});
