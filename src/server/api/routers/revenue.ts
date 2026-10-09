import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { CLOUDUS_SERVICES, SERVICE_PREFIX, serviceKey } from "~/lib/revenue/catalog";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { caretakerProcedure } from "~/server/api/rbac";
import {
  ensureServiceStore,
  fulfillPaidOrder,
  hireService,
  listPipeline,
  pulsePresence,
} from "~/server/revenue/engine";

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

export const revenueRouter = createTRPCRouter({
  catalog: publicProcedure.query(async ({ ctx }) => {
    const ready = await ctx.db.shopItem.count({
      where: { api: { startsWith: SERVICE_PREFIX } },
    });
    if (ready < CLOUDUS_SERVICES.length) {
      await ensureServiceStore(ctx.db);
    }
    const store = await ctx.db.shopItem.findMany({
      where: { api: { startsWith: SERVICE_PREFIX } },
      select: { id: true, api: true, price: true },
    });
    return CLOUDUS_SERVICES.map((service) => {
      const item = store.find((row) => row.api === serviceKey(service.slug));
      return {
        ...service,
        itemId: item?.id ?? null,
        livePrice: item?.price ?? service.priceCents,
      };
    });
  }),

  hire: publicProcedure
    .input(
      z.object({
        slug: slugSchema,
        name: z.string().trim().min(1).max(80),
        email: z.string().email(),
        phone: z.string().trim().max(32).optional(),
        note: z.string().trim().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hired = await hireService(ctx.db, input);
      if (!hired) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cloudus store is not ready.",
        });
      }
      return hired;
    }),

  ensureStore: caretakerProcedure.mutation(async ({ ctx }) => {
    return ensureServiceStore(ctx.db);
  }),

  pulse: caretakerProcedure.mutation(async ({ ctx }) => {
    return pulsePresence(ctx.db);
  }),

  fulfill: caretakerProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const result = await fulfillPaidOrder(ctx.db, input.orderId);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order is not a Cloudus service." });
      }
      return result;
    }),

  pipeline: caretakerProcedure.query(async ({ ctx }) => {
    return listPipeline(ctx.db);
  }),
});
