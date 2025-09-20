import { Prisma } from "@prisma/client"; // Add this import

list: publicProcedure.input(listInput).query(async ({ ctx, input }) => {
  const where: Prisma.ShopItemWhereInput = input.query && input.query.length > 0
    ? {
        OR: [
          { name: { contains: input.query, mode: "insensitive" as Prisma.QueryMode } },
          { description: { contains: input.query, mode: "insensitive" as Prisma.QueryMode } },
          { type: { contains: input.query, mode: "insensitive" as Prisma.QueryMode } },
        ],
      }
    : {};

  const items = await ctx.db.shopItem.findMany({
    where,
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
  // ...rest of your code...
});