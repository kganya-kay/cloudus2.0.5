import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  Role,
  ProjectBidStatus,
  ProjectTaskStatus,
  ProjectTaskPayoutType,
  ProjectTaskPayoutStatus,
  PaymentStatus,
} from "@prisma/client";
import { isSuperAdminEmail } from "~/server/auth/super-admin";
import {
  notifyProjectBidDecision,
  notifyProjectCollaboration,
  notifyProjectPayoutRequest,
  notifyProjectPayoutUpdate,
} from "../notification-service";
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

const ensureProjectOwner = async (
  ctx: { db: any; session: { user: { id: string; role: Role; email?: string | null } } },
  projectId: number,
) => {
  const project = await ctx.db.project.findUnique({
    where: { id: projectId },
    select: { id: true, createdById: true, price: true },
  });
  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
  }
  if (!canManageAllProjects(ctx) && project.createdById !== ctx.session.user.id) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return project;
};

const ensureProjectContributor = async (
  ctx: { db: any; session: { user: { id: string; role: Role; email?: string | null } } },
  projectId: number,
) => {
  const project = await ctx.db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      createdById: true,
      contributors: { select: { id: true } },
    },
  });
  if (!project) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
  }
  const viewerId = ctx.session.user.id;
  const isContributor =
    viewerId === project.createdById ||
    project.contributors.some((contributor: { id: string }) => contributor.id === viewerId) ||
    canManageAllProjects(ctx);
  if (!isContributor) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return project;
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
  taskIds: z.array(z.number().int().positive()).min(1),
  message: z.string().max(1000).optional(),
});

const bidListInput = z.object({
  projectId: z.number().int().positive(),
});

const respondBidInput = z.object({
  bidId: z.number().int().positive(),
  action: z.enum(["APPROVE", "REJECT"]),
});

const projectIdParam = z.object({ projectId: z.number().int().positive() });

const createTaskInput = z.object({
  projectId: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  budgetCents: z.number().int().nonnegative(),
});

const updateTaskInput = z.object({
  taskId: z.number().int().positive(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  budgetCents: z.number().int().nonnegative().optional(),
});

const taskIdInput = z.object({ taskId: z.number().int().positive() });

const taskProgressInput = z.object({
  taskId: z.number().int().positive(),
  status: z.enum(["IN_PROGRESS", "SUBMITTED"]),
  note: z.string().max(2000).optional(),
});

const taskReviewInput = z.object({
  taskId: z.number().int().positive(),
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(2000).optional(),
});

const payoutRequestInput = z.object({
  taskId: z.number().int().positive(),
  type: z.nativeEnum(ProjectTaskPayoutType),
  amountCents: z.number().int().positive().optional(),
});

const payoutRespondInput = z.object({
  requestId: z.number().int().positive(),
  action: z.enum(["APPROVE", "REJECT"]),
});

const ownerPayoutInput = z.object({
  taskId: z.number().int().positive(),
});

const launchConfiguratorInput = z.object({
  idea: z.object({
    title: z.string().min(3),
    goal: z.string().min(10),
    audience: z.string().min(3),
    success: z.string().min(3),
    launchType: z.string().min(2),
    timeline: z.string().min(3),
    aiSummary: z.string().optional(),
  }),
  contact: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(5),
    company: z.string().min(1),
    website: z.string().url().optional(),
  }),
  budget: z.object({
    totalZar: z.number().positive(),
    currency: z.string().min(2).max(5).default("ZAR"),
    depositPercent: z.number().min(10).max(90).default(50),
  }),
  notes: z.string().max(2000).optional(),
});

const projectPaymentPortalInput = z.object({
  projectId: z.number().int().positive(),
});

const marketplaceTasksInput = z
  .object({
    limit: z.number().int().positive().max(50).optional(),
    tag: z.string().optional(),
    role: z.enum(["SUPPLIER", "DRIVER", "CREATOR"]).optional(),
  })
  .optional();

const marketplaceListInput = z
  .object({
    limit: z.number().int().min(1).max(60).optional(),
  })
  .optional();

const paymentPreferenceUpdateInput = z.object({
  projectId: z.number().int().positive(),
  autopayEnabled: z.boolean().optional(),
  autopayThresholdPercent: z.number().int().min(10).max(100).optional(),
  tipPercent: z.number().int().min(0).max(100).optional(),
});

const tipPaymentInput = z.object({
  projectId: z.number().int().positive(),
  amountCents: z.number().int().min(500),
  message: z.string().max(240).optional(),
});

const cleanPhoneToNumber = (value: string) => {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return 0;
  const asNumber = Number(digits);
  return Number.isNaN(asNumber) ? 0 : asNumber;
};

const resolveLeadOwnerUserId = async (
  ctx: { session?: { user?: { id: string } } | null; db: any },
  contact: { firstName: string; lastName: string; email: string },
) => {
  if (ctx.session?.user?.id) {
    return ctx.session.user.id;
  }
  const existing = await ctx.db.user.findUnique({
    where: { email: contact.email },
    select: { id: true },
  });
  if (existing?.id) {
    return existing.id;
  }
  const fullName = `${contact.firstName} ${contact.lastName}`.trim() || contact.email;
  const created = await ctx.db.user.create({
    data: {
      email: contact.email,
      name: fullName,
      role: Role.CUSTOMER,
    },
    select: { id: true },
  });
  if (!created?.id) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to create project owner for configurator submission.",
    });
  }
  return created.id;
};

const getOrCreatePaymentPreference = async (ctx: { db: any }, projectId: number) => {
  const existing = await ctx.db.projectPaymentPreference.findUnique({
    where: { projectId },
  });
  if (existing) return existing;
  return ctx.db.projectPaymentPreference.create({
    data: {
      projectId,
    },
  });
};

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
          createdBy: { select: { id: true, name: true, email: true, image: true } },
          contributors: { select: { id: true, name: true, email: true, image: true } },
          followers: {
            take: 8,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
          _count: { select: { followers: true, contributors: true, bids: true } },
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

  marketplace: publicProcedure
    .input(marketplaceListInput)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 30;
      const projects = await ctx.db.project.findMany({
        where: { visibility: "PUBLIC" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true, image: true } },
          tasks: {
            where: { status: ProjectTaskStatus.BACKLOG },
            orderBy: { createdAt: "asc" },
            take: 6,
            select: {
              id: true,
              title: true,
              description: true,
              budgetCents: true,
              status: true,
              assignedToId: true,
              skills: true,
            },
          },
          _count: { select: { followers: true, contributors: true, bids: true } },
        },
      });

      return projects.map((project) => {
        const openTasks = project.tasks.filter((task) => !task.assignedToId);
        const availableBudgetCents = openTasks.reduce(
          (sum, task) => sum + (task.budgetCents ?? 0),
          0,
        );
        return {
          ...project,
          tasks: openTasks,
          openTaskCount: openTasks.length,
          availableBudgetCents,
        };
      });
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
      const tasks = await ctx.db.projectTask.findMany({
        where: {
          id: { in: input.taskIds },
          projectId: project.id,
        },
        select: { id: true, budgetCents: true, assignedToId: true, status: true },
      });
      if (tasks.length !== input.taskIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more selected tasks are invalid for this project.",
        });
      }
      const blockedTask = tasks.find(
        (task) => task.assignedToId !== null || task.status !== ProjectTaskStatus.BACKLOG,
      );
      if (blockedTask) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some tasks are already claimed or not open for bids.",
        });
      }
      const totalBudget = tasks.reduce((sum: number, task) => sum + (task.budgetCents ?? 0), 0);
      if (totalBudget <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected tasks must have a budget assigned.",
        });
      }
      return ctx.db.projectBid.create({
        data: {
          projectId: project.id,
          userId: ctx.session.user.id,
          amount: Math.max(1, totalBudget),
          message: input.message ?? null,
          status: ProjectBidStatus.PENDING,
          tasks: {
            create: tasks.map((task) => ({ taskId: task.id })),
          },
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
          tasks: {
            include: {
              task: { select: { id: true, title: true, budgetCents: true, status: true } },
            },
          },
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
          tasks: {
            include: {
              task: {
                select: {
                  id: true,
                  title: true,
                  budgetCents: true,
                  assignedToId: true,
                  status: true,
                },
              },
            },
          },
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
      const totalTaskBudgetCents =
        bid.tasks?.reduce((sum, link) => sum + (link.task?.budgetCents ?? 0), 0) ?? 0;
      const conflictingTask = bid.tasks.find(
        (link) => link.task?.assignedToId && link.task.assignedToId !== bid.userId,
      );
      if (conflictingTask) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more tasks in this bid are already assigned to another contributor.",
        });
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.projectBid.update({
          where: { id: bid.id },
          data: { status: nextStatus },
        });
        if (nextStatus === ProjectBidStatus.APPROVED) {
          const taskIds = bid.tasks
            .map((link) => link.task?.id)
            .filter((id): id is number => typeof id === "number");
          if (taskIds.length > 0) {
            await tx.projectTask.updateMany({
              where: { id: { in: taskIds }, projectId: bid.projectId },
              data: { assignedToId: bid.userId },
            });
            await tx.projectTask.updateMany({
              where: {
                id: { in: taskIds },
                projectId: bid.projectId,
                status: ProjectTaskStatus.BACKLOG,
              },
              data: { status: ProjectTaskStatus.IN_PROGRESS },
            });
          }
          await tx.project.update({
            where: { id: bid.projectId },
            data: {
              contributors: { connect: { id: bid.userId } },
              ...(totalTaskBudgetCents > 0
                ? { cost: { increment: totalTaskBudgetCents } }
                : {}),
            },
          });
        }
      });

      if (bid.userId) {
        void notifyProjectBidDecision(ctx, {
          projectId: bid.projectId,
          userId: bid.userId,
          status: nextStatus,
          taskCount: bid.tasks?.length ?? 0,
          amountCents: totalTaskBudgetCents,
        });
      }

      return { status: nextStatus };
    }),

  tasks: publicProcedure
    .input(projectIdParam)
    .query(async ({ ctx, input }) => {
      const tasks = await ctx.db.projectTask.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "asc" },
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          payoutRequests: {
            orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
      return tasks;
    }),

  createTask: protectedProcedure
    .input(createTaskInput)
    .mutation(async ({ ctx, input }) => {
      await ensureProjectOwner(ctx, input.projectId);
      return ctx.db.projectTask.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          description: input.description ?? null,
          budgetCents: input.budgetCents,
        },
      });
    }),

  updateTask: protectedProcedure
    .input(updateTaskInput)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.projectTask.findUnique({
        where: { id: input.taskId },
        select: { projectId: true },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }
      await ensureProjectOwner(ctx, task.projectId);
      return ctx.db.projectTask.update({
        where: { id: input.taskId },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description ?? null } : {}),
          ...(input.budgetCents !== undefined ? { budgetCents: input.budgetCents } : {}),
        },
      });
    }),

  deleteTask: protectedProcedure
    .input(taskIdInput)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.projectTask.findUnique({
        where: { id: input.taskId },
        select: { projectId: true },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }
      await ensureProjectOwner(ctx, task.projectId);
      await ctx.db.projectTaskPayoutRequest.deleteMany({
        where: { taskId: input.taskId },
      });
      return ctx.db.projectTask.delete({ where: { id: input.taskId } });
    }),

  splitTaskBudget: protectedProcedure
    .input(projectIdParam)
    .mutation(async ({ ctx, input }) => {
      const project = await ensureProjectOwner(ctx, input.projectId);
      const tasks = await ctx.db.projectTask.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: "asc" },
      });
      if (tasks.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add tasks before splitting the budget.",
        });
      }
      const totalBudget = project.price > 0 ? project.price : tasks.reduce((sum, task) => sum + task.budgetCents, 0);
      if (totalBudget <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Project budget must be greater than zero.",
        });
      }
      const evenShare = Math.floor(totalBudget / tasks.length);
      let remainder = totalBudget - evenShare * tasks.length;
      await Promise.all(
        tasks.map((task, index) => {
          const bonus = index === tasks.length - 1 ? remainder : 0;
          const nextAmount = evenShare + bonus;
          remainder = remainder - bonus;
          return ctx.db.projectTask.update({
            where: { id: task.id },
            data: { budgetCents: nextAmount },
          });
        }),
      );
      return { ok: true as const };
    }),

  claimTask: protectedProcedure
    .input(taskIdInput)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.projectTask.findUnique({
        where: { id: input.taskId },
        select: {
          id: true,
          title: true,
          projectId: true,
          assignedToId: true,
          status: true,
          project: { select: { createdById: true } },
        },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }
      await ensureProjectContributor(ctx, task.projectId);
      if (task.assignedToId && task.assignedToId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Task is already assigned to another contributor.",
        });
      }
      if (task.assignedToId === ctx.session.user.id) {
        return task;
      }
      if (task.status !== ProjectTaskStatus.BACKLOG) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only backlog tasks can be claimed.",
        });
      }
      const updated = await ctx.db.projectTask.update({
        where: { id: task.id },
        data: {
          assignedToId: ctx.session.user.id,
          status:
            task.status === ProjectTaskStatus.BACKLOG
              ? ProjectTaskStatus.IN_PROGRESS
              : task.status,
        },
      });
      if (task.project?.createdById) {
        void notifyProjectCollaboration(ctx, {
          projectId: task.projectId,
          ownerId: task.project.createdById,
          collaboratorId: ctx.session.user.id,
          taskTitle: task.title,
        });
      }
      return updated;
    }),

  progressTask: protectedProcedure
    .input(taskProgressInput)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.projectTask.findUnique({
        where: { id: input.taskId },
        select: {
          projectId: true,
          assignedToId: true,
          status: true,
        },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }
      if (task.assignedToId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the assigned contributor can update this task.",
        });
      }
      const nextStatus =
        input.status === "IN_PROGRESS"
          ? ProjectTaskStatus.IN_PROGRESS
          : ProjectTaskStatus.SUBMITTED;
      const data: Record<string, unknown> = { status: nextStatus };
      if (input.status === "SUBMITTED") {
        data.submittedAt = new Date();
        data.submissionNote = input.note ?? null;
      } else {
        data.submissionNote = input.note ?? null;
      }
      return ctx.db.projectTask.update({
        where: { id: input.taskId },
        data,
      });
    }),

  reviewTask: protectedProcedure
    .input(taskReviewInput)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.projectTask.findUnique({
        where: { id: input.taskId },
        select: { projectId: true },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }
      await ensureProjectOwner(ctx, task.projectId);
      const nextStatus =
        input.action === "APPROVE"
          ? ProjectTaskStatus.COMPLETED
          : ProjectTaskStatus.REJECTED;
      return ctx.db.projectTask.update({
        where: { id: input.taskId },
        data: {
          status: nextStatus,
          approvedAt: input.action === "APPROVE" ? new Date() : null,
          submissionNote: input.note ?? null,
        },
      });
    }),

  requestTaskPayout: protectedProcedure
    .input(payoutRequestInput)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.projectTask.findUnique({
        where: { id: input.taskId },
        select: {
          title: true,
          projectId: true,
          budgetCents: true,
          assignedToId: true,
          project: { select: { createdById: true } },
          payoutRequests: {
            where: { status: ProjectTaskPayoutStatus.PENDING },
            select: { id: true },
          },
        },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }
      if (task.assignedToId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the assigned contributor can request payouts.",
        });
      }
      if (task.payoutRequests.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have a pending payout request for this task.",
        });
      }
      let amount = 0;
      if (input.type === ProjectTaskPayoutType.HALF) {
        amount = Math.round(task.budgetCents / 2);
      } else if (input.type === ProjectTaskPayoutType.FULL) {
        amount = task.budgetCents;
      } else {
        amount = input.amountCents ?? 0;
      }
      if (amount <= 0 || amount > task.budgetCents) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payout amount.",
        });
      }
      const request = await ctx.db.projectTaskPayoutRequest.create({
        data: {
          taskId: input.taskId,
          userId: ctx.session.user.id,
          amountCents: amount,
          type: input.type,
          status: ProjectTaskPayoutStatus.PENDING,
        },
      });
      if (task.project?.createdById) {
        void notifyProjectPayoutRequest(ctx, {
          projectId: task.projectId,
          ownerId: task.project.createdById,
          taskTitle: task.title,
          amountCents: amount,
        });
      }
      return request;
    }),

  respondTaskPayout: protectedProcedure
    .input(payoutRespondInput)
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.projectTaskPayoutRequest.findUnique({
        where: { id: input.requestId },
        select: {
          id: true,
          status: true,
          amountCents: true,
          userId: true,
          task: { select: { projectId: true, title: true } },
        },
      });
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payout request not found." });
      }
      await ensureProjectOwner(ctx, request.task.projectId);
      if (request.status !== ProjectTaskPayoutStatus.PENDING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payout request already processed.",
        });
      }
      const nextStatus =
        input.action === "APPROVE"
          ? ProjectTaskPayoutStatus.APPROVED
          : ProjectTaskPayoutStatus.REJECTED;
      const updated = await ctx.db.$transaction(async (tx) => {
        const result = await tx.projectTaskPayoutRequest.update({
          where: { id: request.id },
          data: {
            status: nextStatus,
            resolvedAt: new Date(),
          },
        });
        if (nextStatus === ProjectTaskPayoutStatus.APPROVED) {
          await tx.project.update({
            where: { id: request.task.projectId },
            data: { cost: { increment: request.amountCents } },
          });
        }
        return result;
      });
      if (request.userId) {
        void notifyProjectPayoutUpdate(ctx, {
          projectId: request.task.projectId,
          contributorId: request.userId,
          taskTitle: request.task.title ?? "Task",
          amountCents: request.amountCents,
          status: nextStatus,
        });
      }
      return updated;
    }),

  ownerPayoutTask: protectedProcedure
    .input(ownerPayoutInput)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.projectTask.findUnique({
        where: { id: input.taskId },
        select: {
          id: true,
          projectId: true,
          budgetCents: true,
          assignedToId: true,
          status: true,
          project: { select: { createdById: true } },
          payoutRequests: { select: { status: true } },
          title: true,
        },
      });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }
      await ensureProjectOwner(ctx, task.projectId);
      if (!task.assignedToId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Assign the task to a contributor before paying out.",
        });
      }
      if (!["APPROVED", "COMPLETED"].includes(task.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only approved or completed tasks can be paid out by the owner.",
        });
      }
      const hasPending = task.payoutRequests.some(
        (request) => request.status === ProjectTaskPayoutStatus.PENDING,
      );
      if (hasPending) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "There is already a pending payout request for this task.",
        });
      }
      const hasApproved = task.payoutRequests.some(
        (request) => request.status === ProjectTaskPayoutStatus.APPROVED,
      );
      if (hasApproved) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This task already has an approved payout.",
        });
      }
      const amountCents = task.budgetCents ?? 0;
      if (amountCents <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Task budget must be greater than zero to pay out.",
        });
      }
      const assignedToId = task.assignedToId as string;

      const payout = await ctx.db.$transaction(async (tx) => {
        const created = await tx.projectTaskPayoutRequest.create({
          data: {
            taskId: task.id,
            userId: assignedToId,
            amountCents,
            type: ProjectTaskPayoutType.FULL,
            status: ProjectTaskPayoutStatus.APPROVED,
            resolvedAt: new Date(),
          },
        });
        await tx.project.update({
          where: { id: task.projectId },
          data: { cost: { increment: amountCents } },
        });
        return created;
      });

      void notifyProjectPayoutUpdate(ctx, {
        projectId: task.projectId,
        contributorId: assignedToId,
        taskTitle: task.title ?? "Task",
        amountCents,
        status: ProjectTaskPayoutStatus.APPROVED,
      });

      return payout;
    }),

  paymentPortal: protectedProcedure
    .input(projectPaymentPortalInput)
    .query(async ({ ctx, input }) => {
      await ensureProjectOwner(
        { db: ctx.db, session: ctx.session } as Parameters<typeof ensureProjectOwner>[0],
        input.projectId,
      );
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: {
          id: true,
          name: true,
          price: true,
          status: true,
          createdAt: true,
          paymentPreference: true,
          payments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              amountCents: true,
              currency: true,
              status: true,
              provider: true,
              providerRef: true,
              receiptUrl: true,
              purpose: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }
      const preference =
        project.paymentPreference ?? (await getOrCreatePaymentPreference(ctx, project.id));
      const pendingPayment =
        project.payments.find((payment) => payment.status === PaymentStatus.PENDING) ?? null;
      const paidCents = project.payments
        .filter((payment) => payment.status === PaymentStatus.PAID)
        .reduce((sum, payment) => sum + payment.amountCents, 0);
      return {
        project: {
          id: project.id,
          name: project.name,
          price: project.price,
          status: project.status,
          createdAt: project.createdAt,
        },
        payments: project.payments,
        pendingPayment,
        paidCents,
        preferences: preference,
      };
    }),

  updatePaymentPreferences: protectedProcedure
    .input(paymentPreferenceUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const project = await ensureProjectOwner(ctx, input.projectId);
      const preference = await getOrCreatePaymentPreference(ctx, project.id);
      const next = await ctx.db.projectPaymentPreference.update({
        where: { id: preference.id },
        data: {
          ...(input.autopayEnabled !== undefined ? { autopayEnabled: input.autopayEnabled } : {}),
          ...(input.autopayThresholdPercent !== undefined
            ? { autopayThresholdPercent: input.autopayThresholdPercent }
            : {}),
          ...(input.tipPercent !== undefined ? { tipPercent: input.tipPercent } : {}),
        },
      });
      return next;
    }),

  createTipPayment: protectedProcedure
    .input(tipPaymentInput)
    .mutation(async ({ ctx, input }) => {
      const project = await ensureProjectOwner(ctx, input.projectId);
      const preference = await getOrCreatePaymentPreference(ctx, project.id);
      const payment = await ctx.db.projectPayment.create({
        data: {
          projectId: project.id,
          amountCents: input.amountCents,
          currency: "ZAR",
          status: PaymentStatus.PENDING,
          provider: "PAYSTACK",
          purpose: "TIP",
          label: input.message ?? "Creator tip",
          sequence: (await ctx.db.projectPayment.count({ where: { projectId: project.id } })) + 1,
        },
      });
      await ctx.db.projectPaymentPreference.update({
        where: { id: preference.id },
        data: { tipJarCents: { increment: input.amountCents } },
      });
      return { paymentId: payment.id, payment };
    }),

  launchConfigurator: publicProcedure
    .input(launchConfiguratorInput)
    .mutation(async ({ ctx, input }) => {
      const ownerId = await resolveLeadOwnerUserId(ctx, input.contact);
      const totalBudgetCents = Math.round(input.budget.totalZar * 100);
      if (totalBudgetCents <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Budget must be greater than zero.",
        });
      }
      const depositPercent = input.budget.depositPercent ?? 50;
      const depositAmountCents = Math.max(
        100,
        Math.round(totalBudgetCents * (depositPercent / 100)),
      );
      const highlightLinks = [
        `Goal: ${input.idea.goal}`,
        `Audience: ${input.idea.audience}`,
        `Success: ${input.idea.success}`,
        `Timeline: ${input.idea.timeline}`,
        input.notes ? `Notes: ${input.notes}` : null,
      ].filter((item): item is string => Boolean(item));
      const summary = [
        input.idea.goal,
        `Primary audience: ${input.idea.audience}`,
        `Success looks like: ${input.idea.success}`,
        `Desired launch timeline: ${input.idea.timeline}`,
        input.notes,
        input.idea.aiSummary,
      ]
        .filter(Boolean)
        .join("\n\n");
      const contactName = `${input.contact.firstName} ${input.contact.lastName}`.trim();
      const phoneNumber = cleanPhoneToNumber(input.contact.phone);
      const result = await ctx.db.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: {
            name: input.idea.title,
            description: summary,
            createdBy: { connect: { id: ownerId } },
            type: input.idea.launchType,
            price: totalBudgetCents,
            link: "/projects",
            api: "projects.launch-configurator",
            contactNumber: phoneNumber,
            links: highlightLinks.slice(0, 5),
            status: "Pending 50% deposit",
            image: "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf",
          },
        });
        const projectLink = `/projects/${project.id}`;
        await tx.project.update({
          where: { id: project.id },
          data: { link: projectLink },
        });
        const depositPayment = await tx.projectPayment.create({
          data: {
            projectId: project.id,
            amountCents: depositAmountCents,
            currency: input.budget.currency,
            purpose: "DEPOSIT",
          },
        });
        return { projectId: project.id, projectPaymentId: depositPayment.id };
      });
      return {
        projectId: result.projectId,
        projectStatus: "Pending 50% deposit" as const,
        depositAmountCents,
        depositPercent,
        depositCurrency: input.budget.currency,
        projectPaymentId: result.projectPaymentId,
        paymentPath: `/projects/${result.projectId}/payment?paymentId=${result.projectPaymentId}`,
      };
    }),

  contributorOverview: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const [activeTasks, completedTasks, payoutRequests] = await Promise.all([
      ctx.db.projectTask.findMany({
        where: {
          assignedToId: userId,
          status: {
            in: [
              ProjectTaskStatus.BACKLOG,
              ProjectTaskStatus.IN_PROGRESS,
              ProjectTaskStatus.SUBMITTED,
            ],
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: {
          project: { select: { id: true, name: true, image: true } },
        },
      }),
      ctx.db.projectTask.findMany({
        where: {
          assignedToId: userId,
          status: { in: [ProjectTaskStatus.APPROVED, ProjectTaskStatus.COMPLETED] },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
      ctx.db.projectTaskPayoutRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          task: {
            select: {
              id: true,
              title: true,
              budgetCents: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    const notifications = [
      ...activeTasks
        .filter((task) => task.status === ProjectTaskStatus.SUBMITTED)
        .map((task) => ({
          id: `task-${task.id}`,
          title: `${task.title} awaiting approval`,
          body: task.project.name,
          link: `/projects/${task.project.id}#tasks`,
          severity: "info" as const,
        })),
      ...payoutRequests
        .filter((request) => request.status === ProjectTaskPayoutStatus.PENDING)
        .map((request) => ({
          id: `payout-${request.id}`,
          title: "Payout request pending",
          body: `${request.task.title} · ${request.task.project.name}`,
          link: `/projects/${request.task.project.id}#tasks`,
          severity: "warning" as const,
          amountCents: request.amountCents,
        })),
    ];

    return {
      activeTasks,
      completedTasks,
      payoutRequests,
      notifications,
    };
  }),

  marketplaceTasks: publicProcedure
    .input(marketplaceTasksInput)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 12;
      const inferredTag =
        input?.tag ??
        (input?.role === "SUPPLIER"
          ? "supplier"
          : input?.role === "DRIVER"
            ? "driver"
            : undefined);
      const tasks = await ctx.db.projectTask.findMany({
        where: {
          status: ProjectTaskStatus.BACKLOG,
          assignedToId: null,
          project: {
            visibility: "PUBLIC",
            ...(inferredTag ? { tags: { has: inferredTag } } : {}),
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              image: true,
              tags: true,
              type: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return tasks;
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
