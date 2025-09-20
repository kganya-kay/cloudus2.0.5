import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

/* ----------------------- Zod Schemas ----------------------- */

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
  priceCents: z.number().int().nonnegative().optional(), // maps to 'price'
  image: z.string().url().optional(),
  link: z.string().optional(),
  api: z.string().optional(),
  links: z.array(z.string()).optional(),
});

type UpdateInput = z.infer<typeof updateShopItemInput>;

const idParam = z.object({ id: z.number().int().positive() });

const listInput = z.object({
  take: z.number().int().min(1).max(100).default(20),
  cursor: z.number().int().positive().optional(), // use ShopItem.id as cursor
  query: z.string().trim().optional(),
});

const createOrderInput = z.object({
  itemId: z.number().int().positive(),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  priceCentsOverride: z.number().int().nonnegative().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  addressLine1: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().optional(),
  deliveryCents: z.number().int().nonnegative().default(0),
  currency: z.string().default("ZAR"),
  estimatedKg: z.number().positive().optional(),
  supplierId: z.string().optional(),
  caretakerId: z.string().optional(),
});

const contributorInput = z.object({
  itemId: z.number().int().positive(),
  userId: z.string().min(1),
});

/* ----------------------- Helpers ----------------------- */

const isDefined = <T,>(v: T | undefined): v is T => v !== undefined;

function buildUpdateData(input: UpdateInput): Prisma.ShopItemUpdateInput {
  const { priceCents, name, description, type, image, link, api, links } = input;
  const data: Prisma.ShopItemUpdateInput = {};
  if (isDefined(name)) data.name = name;
  if (isDefined(description)) data.description = description;
  if (isDefined(type)) data.type = type;
  if (isDefined(image)) data.image = image;
  if (isDefined(link)) data.link = link;
  if (isDefined(api)) data.api = api;
  if (isDefined(links)) data.links = links;
  if (isDefined(priceCents)) data.price = priceCents;
  return data;
}

/* ----------------------- Router ----------------------- */

export const shopItemRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => ({ greeting: `Hello ${input.text}` })),

  /* CREATE */
  create: protectedProcedure
    .input(createShopItemInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.shopItem.create({
        data: {
          name: input.name,
          description: input.description,
          type: input.type,
          price: input.priceCents, // cents
          image:
            input.image ??
            "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf",
          link: input.link ?? "",
          api: input.api ?? "",
          links: input.links ?? [],
          createdBy: { connect: { id: ctx.session.user.id } },
          contributors: { connect: [{ id: ctx.session.user.id }] },
        },
      });
    }),

  /* UPDATE */
  update: protectedProcedure
    .input(updateShopItemInput)
    .mutation(async ({ ctx, input }) => {
      const data = buildUpdateData(input);
      try {
        return await ctx.db.shopItem.update({
          where: { id: input.id },
          data,
        });
      } catch (err: unknown) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2025"
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shop item not found",
          });
        }
        throw err;
      }
    }),

  /* DELETE (hard-delete; guard when orders exist) */
  delete: protectedProcedure
    .input(idParam)
    .mutation(async ({ ctx, input }) => {
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
        return { ok: true as const };
      } catch (err: unknown) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2025"
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shop item not found",
          });
        }
        throw err;
      }
    }),

  /* CREATE ORDER for an item */
  createOrder: protectedProcedure
    .input(createOrderInput)
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.shopItem.findUnique({
        where: { id: input.itemId },
        select: { id: true, name: true, price: true, description: true },
      });
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shop item not found" });
      }

      const priceToUse = isDefined(input.priceCentsOverride)
        ? input.priceCentsOverride
        : item.price;

      return ctx.db.order.create({
        data: {
          name: input.name ?? `Order: ${item.name}`,
          description: input.description ?? item.description ?? "Order created",
          price: priceToUse,
          link: "",
          api: "",
          links: [],
          createdBy: { connect: { id: ctx.session.user.id } },

          createdFor: { connect: { id: item.id } },

          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,

          addressLine1: input.addressLine1,
          suburb: input.suburb,
          city: input.city,

          deliveryCents: input.deliveryCents ?? 0,
          currency: input.currency ?? "ZAR",

          estimatedKg: input.estimatedKg,
          ...(input.supplierId && {
            supplier: { connect: { id: input.supplierId } },
          }),
          ...(input.caretakerId && {
            caretaker: { connect: { id: input.caretakerId } },
          }),
        },
      });
    }),

  /* LIST with search + cursor pagination */
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

    const rows = await ctx.db.shopItem.findMany({
      where,
      take: input.take + 1, // one extra to compute nextCursor
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true, likes: true } },
      },
    });

    let nextCursor: number | undefined = undefined;
    if (rows.length > input.take) {
      const next = rows.pop()!;
      nextCursor = next.id;
    }

    const items = rows.map((row) => {
      const { _count, ...rest } = row;
      return {
        ...rest,
        ordersCount: _count.orders,
        likesCount: _count.likes,
      };
    });

    return { items, nextCursor };
  }),

  /* GET ALL (with userLiked) */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.shopItem.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { orders: true, likes: true } },
      },
    });

    let likedSet = new Set<number>();
    const userId = ctx.session?.user?.id;
    if (userId) {
      const liked = await ctx.db.like.findMany({
        where: {
          createdById: userId,
          shopItemId: { in: rows.map((i) => i.id) },
        },
        select: { shopItemId: true },
      });
      likedSet = new Set(liked.map((l) => l.shopItemId!).filter((v): v is number => v != null));
    }

    const items = rows.map((row) => {
      const { _count, ...rest } = row;
      return {
        ...rest,
        ordersCount: _count.orders,
        likesCount: _count.likes,
        userLiked: likedSet.has(row.id),
      };
    });

    return items;
  }),

  /* BY ID */
  getById: publicProcedure.input(idParam).query(async ({ ctx, input }) => {
    const item = await ctx.db.shopItem.findUnique({
      where: { id: input.id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true, status: true, price: true },
        },
      },
    });
    if (!item) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Shop item not found" });
    }
    return item;
  }),

  /* Orders for an item (light) */
  ordersForItem: publicProcedure
    .input(z.object({ itemId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.order.findMany({
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
    }),

  /* M-N: add/remove contributor */
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

  /* Likes */
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
        return { liked: false as const };
      }

      await ctx.db.like.create({
        data: {
          createdById: userId,
          shopItem: { connect: { id: input.itemId } }, // relation name must match schema
        },
      });
      return { liked: true as const };
    }),
});
