import { CampaignStatus, LeadInterest } from "@prisma/client";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { CLOUDUS_SERVICES } from "~/lib/revenue/catalog";
import { OUTREACH_CHANNELS } from "~/lib/outreach/channels";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { caretakerProcedure } from "~/server/api/rbac";
import { discoverForCampaign } from "~/server/outreach/discover";
import { fireDesk, runOrchestration, scheduleToday } from "~/server/outreach/orchestrate";
import { channelReady, handoff, publishPost } from "~/server/outreach/publish";
import { ecosystemSnapshot } from "~/server/outreach/snapshot";

const slugSchema = z.enum([
  "build",
  "studio",
  "blog",
  "shop",
  "rooms",
  "events",
  "laundry",
  "daily",
  "market",
]);

export const outreachRouter = createTRPCRouter({
  snapshot: caretakerProcedure.query(async ({ ctx }) => {
    const snap = await ecosystemSnapshot(ctx.db);
    return {
      ...snap,
      channels: OUTREACH_CHANNELS.map((channel) => ({
        channel,
        ready: channelReady(channel),
        composer: handoff(channel, "/services"),
      })),
    };
  }),

  queue: caretakerProcedure.query(async ({ ctx }) => {
    return ctx.db.outreachPost.findMany({
      orderBy: { scheduledAt: "desc" },
      take: 30,
    });
  }),

  fire: caretakerProcedure
    .input(
      z
        .object({
          channels: z.array(z.enum(["LINKEDIN", "FACEBOOK", "INSTAGRAM"])).optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      return fireDesk(ctx.db, ctx.session.user.id, input?.channels);
    }),

  schedule: caretakerProcedure.mutation(async ({ ctx }) => {
    return scheduleToday(ctx.db, ctx.session.user.id, true);
  }),

  publish: caretakerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const post = await publishPost(ctx.db, input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      return post;
    }),

  runToday: caretakerProcedure.mutation(async ({ ctx }) => {
    return runOrchestration(ctx.db, ctx.session.user.id);
  }),

  campaigns: caretakerProcedure.query(async ({ ctx }) => {
    return ctx.db.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: { select: { leads: true, touches: true } },
        leads: {
          where: { interest: { in: [LeadInterest.CLICKED, LeadInterest.INTERESTED] } },
          take: 8,
          select: { id: true, name: true, interest: true, score: true, email: true },
        },
      },
    });
  }),

  createCampaign: caretakerProcedure
    .input(
      z.object({
        city: z.string().trim().min(2).max(80),
        serviceSlug: slugSchema,
        brief: z.string().trim().max(800).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = CLOUDUS_SERVICES.find((item) => item.slug === input.serviceSlug);
      const campaign = await ctx.db.campaign.create({
        data: {
          name: `${service?.name ?? input.serviceSlug} · ${input.city}`,
          serviceSlug: input.serviceSlug,
          city: input.city,
          brief: input.brief?.trim() || `${service?.name ?? "Cloudus"} for teams in ${input.city}.`,
          emailSubject: `${service?.name ?? "Cloudus"} · ${input.city}`,
          emailBody: "",
          status: CampaignStatus.ACTIVE,
          createdById: ctx.session.user.id,
        },
      });
      const found = await discoverForCampaign(ctx.db, campaign.id);
      return { campaign, found };
    }),

  importLeads: caretakerProcedure
    .input(
      z.object({
        campaignId: z.string().cuid(),
        rows: z
          .array(
            z.object({
              name: z.string().min(1),
              email: z.string().email(),
              company: z.string().optional(),
            }),
          )
          .max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let created = 0;
      for (const row of input.rows) {
        await ctx.db.campaignLead.upsert({
          where: {
            campaignId_osmId: {
              campaignId: input.campaignId,
              osmId: `import:${row.email.toLowerCase()}`,
            },
          },
          update: { email: row.email, name: row.company ?? row.name },
          create: {
            campaignId: input.campaignId,
            name: row.company ?? row.name,
            email: row.email,
            osmId: `import:${row.email.toLowerCase()}`,
            source: "IMPORT",
            consentSource: "admin-import",
          },
        });
        created += 1;
      }
      return { created };
    }),

  pauseCampaign: caretakerProcedure
    .input(z.object({ id: z.string().cuid(), status: z.nativeEnum(CampaignStatus) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.campaign.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  discover: caretakerProcedure
    .input(z.object({ campaignId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return discoverForCampaign(ctx.db, input.campaignId);
    }),

  runs: caretakerProcedure.query(async ({ ctx }) => {
    return ctx.db.orchestrationRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
    });
  }),

  interest: publicProcedure
    .input(z.object({ token: z.string().min(4) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.campaignLead.findUnique({
        where: { token: input.token },
        select: {
          name: true,
          interest: true,
          campaign: { select: { name: true, serviceSlug: true, city: true } },
        },
      });
    }),

  markInterest: publicProcedure
    .input(
      z.object({
        token: z.string().min(4),
        interest: z.enum(["CLICKED", "INTERESTED", "UNSUBSCRIBED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.campaignLead.findUnique({ where: { token: input.token } });
      if (!lead) throw new TRPCError({ code: "NOT_FOUND" });
      if (
        input.interest === "CLICKED" &&
        (lead.interest === LeadInterest.CLICKED ||
          lead.interest === LeadInterest.INTERESTED ||
          lead.interest === LeadInterest.UNSUBSCRIBED)
      ) {
        return { ok: true };
      }
      const next =
        input.interest === "UNSUBSCRIBED"
          ? LeadInterest.UNSUBSCRIBED
          : input.interest === "INTERESTED"
            ? LeadInterest.INTERESTED
            : LeadInterest.CLICKED;
      await ctx.db.campaignLead.update({
        where: { id: lead.id },
        data: {
          interest: next,
          score: { increment: input.interest === "INTERESTED" ? 5 : 2 },
          lastTouchedAt: new Date(),
        },
      });
      await ctx.db.campaignTouch.create({
        data: {
          campaignId: lead.campaignId,
          leadId: lead.id,
          channel: "EMAIL",
          kind: input.interest,
          status: "TRACKED",
          clickedAt: new Date(),
        },
      });
      return { ok: true };
    }),
});
