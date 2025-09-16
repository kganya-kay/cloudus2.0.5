import { Input } from "postcss";
import { z } from "zod";
import { TRPCError } from "@trpc/server";


import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

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
        },
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const project = await ctx.db.project.findFirst({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
    });

    return project ?? null;
  }),

  select: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const selectedItem = await ctx.db.project.findUnique({
        where: { id: input.id },
      });

      return selectedItem ?? null;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.db.project.findMany({
      orderBy: { createdAt: "desc" },
      where: { createdBy: { id: ctx.session.user.id } },
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
      if (project.createdBy?.id !== ctx.session.user.id) {
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
      if (project.createdBy?.id !== ctx.session.user.id) {
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

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
