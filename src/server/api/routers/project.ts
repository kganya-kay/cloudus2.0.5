import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Role, ProjectBidStatus } from "@prisma/client";
import { isSuperAdminEmail } from "~/server/auth/super-admin";


import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const canManageAllProjects = (ctx: {
  session?: { user?: { role: Role; email?: string | null } } | null;
}) => {
  const email = ctx.session?.user?.email ?? null;
  return ctx.session?.user?.role === Role.ADMIN || isSuperAdminEmail(email);
};

const updatableFields = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    type: z.string().optional(),
    price: z.number().optional(),
    link: z.string().optional(),
    contactNumber: z.number().optional(),
    status: z.string().optional(),
    openSource: z.boolean().optional(),
    completed: z.boolean().optional(),
    image: z.string().optional(),
    // If you store gallery links in DB:
    links: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update.",
  });

const bidInput = z.object({
  projectId: z.number().int().positive(),
  amount: z.number().int().positive(),
  message: z.string().max(1000).optional(),
});

const bidListInput = z.object({
  projectId: z.number().int().positive(),
});

const respondBidInput = z.object({
  bidId: z.number().int().positive(),
  action: z.enum(["APPROVE", "REJECT"]),
});

export const projectRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(5),
        type: z.string(),
        price: z.number(),
        link: z.string(),
        contactNumber: z.number(),
        image: z.string().url().optional(),
        links: z.array(z.string().url()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
          type: input.type,
          price: input.price,
          description: input.description,
          link: input.link,
          api: "api empty",
          contactNumber: input.contactNumber,
          image:
            input.image ??
            "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf",
          links: input.links ?? [],
        },
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const project = await ctx.db.project.findFirst({
      orderBy: { createdAt: "desc" },
      where: canManageAllProjects(ctx)
        ? undefined
        : { createdBy: { id: ctx.session.user.id } },
    });

    return project ?? null;
  }),

  select: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          contributors: { select: { id: true, name: true, email: true } },
        },
      });

      if (!project) return null;

      const viewerId = ctx.session?.user?.id ?? null;
      const viewerBid = viewerId
        ? await ctx.db.projectBid.findFirst({
            where: { projectId: project.id, userId: viewerId },
            orderBy: { createdAt: "desc" },
          })
        : null;
      const isOwner = viewerId === project.createdById;
      const isContributor =
        !!viewerId &&
        (isOwner ||
          project.contributors.some((contributor) => contributor.id === viewerId));
      const canManageBids = isOwner || canManageAllProjects(ctx);

      return {
        ...project,
        viewerContext: {
          userId: viewerId,
          isOwner,
          isContributor,
          canManageBids,
          bid: viewerBid,
        },
      };
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      orderBy: { createdAt: "desc" },
      where: canManageAllProjects(ctx)
        ? undefined
        : { createdBy: { id: ctx.session.user.id } },
    });

    return projects ?? null;
  }),

  getOpenSource: publicProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      orderBy: { createdAt: "desc" },
      where: { openSource: true },
    });

    return projects ?? null;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        select: { id: true, createdBy: { select: { id: true } } },
      });
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found.",
        });
      }
      if (!canManageAllProjects(ctx) && project.createdBy?.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not allowed to delete this project.",
        });
      }
      return ctx.db.project.delete({
        where: { id: input.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.number(), data: updatableFields }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
        select: { id: true, createdBy: { select: { id: true } } },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found.",
        });
      }
      if (!canManageAllProjects(ctx) && project.createdBy?.id !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not allowed to update this project.",
        });
      }

      const updated = await ctx.db.project.update({
        where: { id: input.id },
        data: input.data,
      });
      return updated;
    }),

  bid: protectedProcedure
    .input(bidInput)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: {
          id: true,
          createdById: true,
          contributors: { select: { id: true } },
        },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }
      if (project.createdById === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You already own this project.",
        });
      }
      if (
        project.contributors.some((contributor) => contributor.id === ctx.session.user.id)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are already a contributor.",
        });
      }
      const existingPending = await ctx.db.projectBid.findFirst({
        where: {
          projectId: project.id,
          userId: ctx.session.user.id,
          status: ProjectBidStatus.PENDING,
        },
      });
      if (existingPending) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending bid for this project.",
        });
      }
      return ctx.db.projectBid.create({
        data: {
          projectId: project.id,
          userId: ctx.session.user.id,
          amount: Math.max(1, Math.round(input.amount)),
          message: input.message ?? null,
          status: ProjectBidStatus.PENDING,
        },
      });
    }),

  listBids: protectedProcedure
    .input(bidListInput)
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: { createdById: true },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }
      const canManage =
        project.createdById === ctx.session.user.id || canManageAllProjects(ctx);
      if (!canManage) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.projectBid.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });
    }),

  respondBid: protectedProcedure
    .input(respondBidInput)
    .mutation(async ({ ctx, input }) => {
      const bid = await ctx.db.projectBid.findUnique({
        where: { id: input.bidId },
        select: {
          id: true,
          status: true,
          userId: true,
          projectId: true,
          project: { select: { createdById: true } },
        },
      });
      if (!bid) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Bid not found." });
      }
      const canManage =
        bid.project.createdById === ctx.session.user.id || canManageAllProjects(ctx);
      if (!canManage) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (bid.status !== ProjectBidStatus.PENDING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bid already processed.",
        });
      }
      const nextStatus =
        input.action === "APPROVE"
          ? ProjectBidStatus.APPROVED
          : ProjectBidStatus.REJECTED;

      await ctx.db.$transaction(async (tx) => {
        await tx.projectBid.update({
          where: { id: bid.id },
          data: { status: nextStatus },
        });
        if (nextStatus === ProjectBidStatus.APPROVED) {
          await tx.project.update({
            where: { id: bid.projectId },
            data: { contributors: { connect: { id: bid.userId } } },
          });
        }
      });

      return { status: nextStatus };
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
