// src/server/api/routers/careers.ts
import { z } from "zod";
import { EmploymentType, OnsiteType, JobStatus, ApplicationStatus } from "@prisma/client";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { caretakerProcedure, adminProcedure } from "../rbac";
import { TRPCError } from "@trpc/server";

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
  // Public onboarding submit endpoint (renamed from 'apply' to avoid reserved key)
  submitApplication: publicProcedure
    .input(applyInput)
    .mutation(async ({ ctx, input }) => {
      // Basic rate limit: max 3 submissions per 10 minutes per email
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recent = await ctx.db.jobApplication.count({ where: { email: input.email, createdAt: { gte: tenMinAgo } } });
      if (recent >= 3) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many submissions; please try again later." });
      }
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
      // Notifications (stub): log payload; integrate SendGrid/Slack later
      try {
        console.log("New application:", { id: app.id, type: input.type, name: input.name, email: input.email });
      } catch {}
      return { id: app.id };
    }),
  // Admin/Caretaker: list applications with basic filters
  listApplications: caretakerProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          status: z.nativeEnum(ApplicationStatus).optional(),
          page: z.number().int().positive().default(1),
          pageSize: z.number().int().positive().max(100).default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const q = input?.q?.trim();
      const where = {
        ...(input?.status ? { status: input.status } : {}),
        ...(q && q.length > 0
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      } as const;
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;
      const take = pageSize;
      const [items, total] = await Promise.all([
        ctx.db.jobApplication.findMany({
          where,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            resumeUrl: true,
            source: true,
            status: true,
            createdAt: true,
            job: { select: { id: true, slug: true, title: true } },
          },
          skip,
          take,
        }),
        ctx.db.jobApplication.count({ where }),
      ]);
      return { items, total, page, pageSize };
    }),
  // Admin/Caretaker: update application status
  setApplicationStatus: caretakerProcedure
    .input(z.object({ id: z.string().min(1), status: z.nativeEnum(ApplicationStatus) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.jobApplication.update({ where: { id: input.id }, data: { status: input.status } });
    }),
});
