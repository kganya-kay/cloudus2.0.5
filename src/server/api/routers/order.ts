import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const orderRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string(), description : z.string(), type: z.string()}))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.order.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
          price: 50,
          description: input.description,
          
          link: "Link to item not set",
          api:"api empty",
          createdFor:  {connect: {
            id : 1
          }}        
        },
      });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const order = await ctx.db.order.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return order ?? null;
  }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const allOrders = await ctx.db.order.findMany({
      orderBy: { createdAt: "desc" },
      
    });

    return allOrders ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});