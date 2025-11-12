// src/server/api/routers/careers.ts
import { z } from "zod";
import { EmploymentType, OnsiteType, JobStatus } from "@prisma/client";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";

const OnboardType = z.enum([
  "SUPPLIER",
  "DRIVER",
  "CARETAKER",
  "ADMIN",
  "CUSTOMER",
  "APPLICANT", // generic job applicant
]);

const applyInput = z.object({
  type: OnboardType,
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  coverLetter: z.string().optional(),
  answers: z.record(z.any()).optional(),
  source: z.string().optional(),
  // for direct job role applications we can pass a slug; unified flow will use type mapping
  jobSlug: z.string().optional(),
});

type Ctx = Parameters<Parameters<typeof publicProcedure["mutation"]>[0]>[0]["ctx"];

async function getOrCreateJobForType(ctx: Ctx, type: z.infer<typeof OnboardType>, explicitSlug?: string) {
  const map: Record<z.infer<typeof OnboardType>, { slug: string; title: string; employmentType: EmploymentType; onsiteType: OnsiteType; remoteAllowed?: boolean }>
    = {
    SUPPLIER: { slug: "supplier-partner", title: "Supplier Partner", employmentType: EmploymentType.CONTRACT, onsiteType: OnsiteType.HYBRID },
    DRIVER: { slug: "driver-partner", title: "Driver Partner", employmentType: EmploymentType.CONTRACT, onsiteType: OnsiteType.HYBRID },
    CARETAKER: { slug: "local-business-caretaker", title: "Local Business Caretaker", employmentType: EmploymentType.FULL_TIME, onsiteType: OnsiteType.ONSITE },
    ADMIN: { slug: "operations-admin", title: "Operations Admin", employmentType: EmploymentType.FULL_TIME, onsiteType: OnsiteType.HYBRID },
    CUSTOMER: { slug: "customer-onboarding", title: "Customer Onboarding", employmentType: EmploymentType.CONTRACT, onsiteType: OnsiteType.REMOTE },
    APPLICANT: { slug: explicitSlug ?? "general-applicant", title: "General Applicant", employmentType: EmploymentType.CONTRACT, onsiteType: OnsiteType.HYBRID },
  };
  const spec = map[type];
  const slug = explicitSlug ?? spec.slug;
  const existing = await ctx.db.job.findFirst({ where: { slug } });
  if (existing) return existing;
  // create minimal job row so JobApplication can reference it
  return ctx.db.job.create({
    data: {
      slug,
      title: spec.title,
      summary: `${spec.title} application via onboarding form`,
      description: `${spec.title} application generated from onboarding flow.`,
      employmentType: spec.employmentType,
      onsiteType: spec.onsiteType,
      remoteAllowed: spec.onsiteType !== OnsiteType.ONSITE,
      tags: [],
      status: JobStatus.OPEN,
      createdBy: { connect: { id: ctx.session?.user?.id ?? (await getOrCreateSystemUser(ctx)).id } },
    },
  });
}

async function getOrCreateSystemUser(ctx: Ctx) {
  // Create or retrieve a lightweight system user for seeding jobs when unauthenticated submissions occur.
  const email = "system@cloudus.local";
  const u = await ctx.db.user.findFirst({ where: { email } });
  if (u) return u;
  return ctx.db.user.create({ data: { email, name: "System" } });
}

export const careersRouter = createTRPCRouter({
  // Public onboarding apply endpoint
  apply: publicProcedure
    .input(applyInput)
    .mutation(async ({ ctx, input }) => {
      const job = await getOrCreateJobForType(ctx, input.type, input.jobSlug);
      const app = await ctx.db.jobApplication.create({
        data: {
          jobId: job.id,
          userId: ctx.session?.user?.id ?? null,
          name: input.name,
          email: input.email,
          phone: input.phone,
          resumeUrl: input.resumeUrl,
          coverLetter: input.coverLetter,
          answers: {
            ...(input.answers ?? {}),
            type: input.type,
            source: input.source ?? "onboarding",
          },
          source: input.source ?? "onboarding",
        },
      });
      return { id: app.id };
    }),
});

