import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { adminProcedure } from "../rbac";

const announcementInput = z.object({
  title: z.string().min(3),
  body: z.string().min(3),
  audience: z.string().default("ALL").optional(),
  link: z.string().url().optional(),
});

const listInput = z.object({ limit: z.number().int().positive().max(50).optional() }).optional();

export const platformRouter = createTRPCRouter({
  announcements: publicProcedure.input(listInput).query(async ({ ctx, input }) => {
    return ctx.db.adminAnnouncement.findMany({
      orderBy: { publishedAt: "desc" },
      take: input?.limit ?? 5,
    });
  }),

  publishAnnouncement: adminProcedure
    .input(announcementInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.adminAnnouncement.create({
        data: {
          title: input.title,
          body: input.body,
          audience: input.audience ?? "ALL",
          link: input.link ?? null,
          createdById: ctx.session.user.id,
        },
      });
    }),
});
