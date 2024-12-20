import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const shopItemRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) , description: z.string().min(5), type: z.string()}))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.shopItem.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
          type: input.type,
          price: 50,
          description: input.description,
          link: "Link to item not set",
          api:"api empty"
        },
      });
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    const shopItem = await ctx.db.shopItem.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return shopItem ?? null;
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const allShopItems = await ctx.db.shopItem.findMany({
      orderBy: { createdAt: "desc" },
      
    });

    return allShopItems ?? null;
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});