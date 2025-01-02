import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) , email: z.string().min(5)}))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.create({
        data: {
          name: input.name,
          
          
          
          email: input.email,
          
        },
      });
    }),

  

  select: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const selectedUser = await ctx.db.user.findUnique({
      where: {id: input.id.toString()}
    });

    return selectedUser ?? null;
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      orderBy: { id: "desc" },
      
    });

    return users ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
