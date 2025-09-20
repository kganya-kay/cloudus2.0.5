import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
// add this import at the top of your router file
import { Prisma } from "@prisma/client";

// ---------- Zod Schemas ----------
const createShopItemInput = z.object({
  name: z.string().min(1),
  description: z.string().min(5),
  type: z.string().min(1),
  priceCents: z.number().int().nonnegative(), // maps to Prisma 'price'
  image: z.string().url().optional(),
  link: z.string().default(""),
  api: z.string().default(""),
  links: z.array(z.string()).default([]),
});

const updateShopItemInput = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).optional(),
  description: z.string().min(5).optional(),
  type: z.string().min(1).optional(),
  priceCents: z.number().int().nonnegative().optional(),
  image: z.string().url().optional(),
  link: z.string().optional(),
  api: z.string().optional(),
  links: z.array(z.string()).optional(),
});

const idParam = z.object({ id: z.number().int().positive() });

const listInput = z.object({
  take: z.number().int().min(1).max(100).default(20),
  cursor: z.number().int().positive().optional(), // use ShopItem.id as cursor
  query: z.string().trim().optional(),
});

const createOrderInput = z.object({
  itemId: z.number().int().positive(),
  // Order core
  name: z.string().min(1).optional(), // defaults to item name
  description: z.string().min(1).optional(),
  priceCentsOverride: z.number().int().nonnegative().optional(),
  // Customer & address (optional for MVP)
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  addressLine1: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  deliveryCents: z.number().int().nonnegative().default(0),
  currency: z.string().default("ZAR"),
  estimatedKg: z.number().positive().optional(),
  // Optional supplier / caretaker assignment
  supplierId: z.string().optional(),
  caretakerId: z.string().optional(),
});

const contributorInput = z.object({
  itemId: z.number().int().positive(),
  userId: z.string().min(1),
});

export const shopItemRouter = createTRPCRouter({
  // Simple hello
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => ({ greeting: `Hello ${input.text}` })),

  // CREATE ShopItem
  create: protectedProcedure
    .input(createShopItemInput)
    .mutation(async ({ ctx, input }) => {
      const data = {
        name: input.name,
        description: input.description,
        type: input.type,
        price: input.priceCents, // store cents
        image:
          input.image ??
          "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf",
        link: input.link ?? "Link to item not set",
        api: input.api ?? "api empty",
        links: input.links ?? [],
        createdBy: { connect: { id: ctx.session.user.id } },
        // optionally add creator as contributor:
        contributors: { connect: [{ id: ctx.session.user.id }] },
      };

      return ctx.db.shopItem.create({ data });
    }),

  // UPDATE (edit) ShopItem
  update: protectedProcedure
    .input(updateShopItemInput)
    .mutation(async ({ ctx, input }) => {
      // Map priceCents -> price if provided
      const { id, priceCents, ...rest } = input as any;
      const data: any = { ...rest };
      if (typeof priceCents === "number") data.price = priceCents;

      try {
        return await ctx.db.shopItem.update({
          where: { id },
          data,
        });
      } catch (err: any) {
        if (err.code === "P2025") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shop item not found",
          });
        }
        throw err;
      }
    }),

  // DELETE ShopItem (guard if existing orders)
  delete: protectedProcedure.input(idParam).mutation(async ({ ctx, input }) => {
    const countOrders = await ctx.db.order.count({
      where: { createdForId: input.id },
    });
    if (countOrders > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Cannot delete item with existing orders. Archive it or reassign orders first.",
      });
    }
    try {
      await ctx.db.shopItem.delete({ where: { id: input.id } });
      return { ok: true };
    } catch (err: any) {
      if (err.code === "P2025") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shop item not found",
        });
      }
      throw err;
    }
  }),

  // CREATE Order for a ShopItem (links via createdForId)
  createOrder: protectedProcedure
    .input(createOrderInput)
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.shopItem.findUnique({
        where: { id: input.itemId },
        select: { id: true, name: true, price: true, description: true },
      });
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shop item not found",
        });
      }

      const price = input.priceCentsOverride ?? item.price;

      const order = await ctx.db.order.create({
        data: {
          name: input.name ?? `Order: ${item.name}`,
          description: input.description ?? item.description ?? "Order created",
          price,
          link: "",
          api: "",
          links: [],
          createdBy: { connect: { id: ctx.session.user.id } },

          // link to the item
          createdFor: { connect: { id: item.id } },

          // customer snapshot (optional)
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,

          // address snapshot (optional)
          addressLine1: input.addressLine1,
          suburb: input.suburb,
          city: input.city,

          // money
          deliveryCents: input.deliveryCents ?? 0,
          currency: input.currency ?? "ZAR",

          // fulfilment
          estimatedKg: input.estimatedKg,
          ...(input.supplierId
            ? { supplier: { connect: { id: input.supplierId } } }
            : {}),
          ...(input.caretakerId
            ? { caretaker: { connect: { id: input.caretakerId } } }
            : {}),
        },
      });

      return order;
    }),

  // READ: latest item
  getLatest: publicProcedure.query(async ({ ctx }) => {
    const item = await ctx.db.shopItem.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: true,
        contributors: true,
      },
    });
    return item ?? null;
    // return null if none
  }),

  // READ: list with optional search + cursor pagination
  list: publicProcedure.input(listInput).query(async ({ ctx, input }) => {
    const where: Prisma.ShopItemWhereInput =
      input.query && input.query.length > 0
        ? {
            OR: [
              {
                name: {
                  contains: input.query,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                description: {
                  contains: input.query,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                type: {
                  contains: input.query,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          }
        : {};

    const items = await ctx.db.shopItem.findMany({
      where,
      take: input.take + 1, // one extra to compute nextCursor
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: true,
        contributors: true,
        _count: { select: { orders: true } },
      },
    });

    let nextCursor: number | undefined = undefined;
    if (items.length > input.take) {
      const next = items.pop()!;
      nextCursor = next.id;
    }

    return { items, nextCursor };
  }),

  // READ: by id
  getById: publicProcedure.input(idParam).query(async ({ ctx, input }) => {
    const item = await ctx.db.shopItem.findUnique({
      where: { id: input.id },
      include: {
        createdBy: true,
        contributors: true,
        orders: {
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true, status: true, price: true },
        },
      },
    });
    if (!item) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Shop item not found",
      });
    }
    return item;
  }),

  // READ: orders for an item (lightweight)
  ordersForItem: publicProcedure
    .input(z.object({ itemId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.order.findMany({
        where: { createdForId: input.itemId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          status: true,
          price: true,
          deliveryCents: true,
          currency: true,
          customerName: true,
          suburb: true,
          city: true,
        },
      });
      return orders;
    }),

  // M-N: add a contributor to a ShopItem
  addContributor: protectedProcedure
    .input(contributorInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.findUniqueOrThrow({ where: { id: input.userId } });
      return ctx.db.shopItem.update({
        where: { id: input.itemId },
        data: { contributors: { connect: { id: input.userId } } },
        include: { contributors: true },
      });
    }),

  // M-N: remove a contributor from a ShopItem
  removeContributor: protectedProcedure
    .input(contributorInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.findUniqueOrThrow({ where: { id: input.userId } });
      return ctx.db.shopItem.update({
        where: { id: input.itemId },
        data: { contributors: { disconnect: { id: input.userId } } },
        include: { contributors: true },
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const raw = await ctx.db.shopItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: true,
        contributors: true,
        _count: { select: { orders: true, likes: true } }, // <-- needs ShopItem.likes back-rel
      },
    });

    let likedSet = new Set<number>();
    if (ctx.session?.user?.id) {
      const liked = await ctx.db.like.findMany({
        where: {
          createdById: ctx.session.user.id,
          shopItemId: { in: raw.map((i) => i.id) },
        },
        select: { shopItemId: true },
      });
      likedSet = new Set(liked.map((l) => l.shopItemId!));
    }

    // attach the meta, strip _count
    return raw.map((i) => ({
      ...i,
      ordersCount: i._count.orders,
      likesCount: i._count.likes,
      userLiked: likedSet.has(i.id),
      _count: undefined, // keep output clean
    }));
  }),

  // Toggle like for current user
  toggleLike: protectedProcedure
    .input(z.object({ itemId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.like.findFirst({
        where: { createdById: userId, shopItemId: input.itemId },
        select: { id: true },
      });

      if (existing) {
        await ctx.db.like.delete({ where: { id: existing.id } });
        return { liked: false };
      }

      await ctx.db.like.create({
        data: {
          createdById: userId,
          shopItem: { connect: { id: input.itemId } }, // uses ShopItemLikes relation
        },
      });
      return { liked: true };
    }),

  // DEMO secret
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
