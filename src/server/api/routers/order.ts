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

  create: publicProcedure
    .input(z.object({ name: z.string(), description : z.string(), type: z.string(), itemId: z.number(), contactNumber: z.number(),price: z.number()}))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.order.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session? ctx.session.user.id : "cm55nwppt000013smfhzgcutj"} } ,
          price: input.price,
          description: input.description + "contact Number=" + input.contactNumber,      
          link: "Link to item not set",
          links: [input.contactNumber.toString()],
          api: ctx.session ? input.type : "Signed Out Order" ,
           
          createdFor:  {connect: {
            id : input.itemId
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