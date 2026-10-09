import type { PrismaClient } from "@prisma/client";

import { CLOUDUS_SERVICES, serviceOfTheDay } from "~/lib/revenue/catalog";

type Db = PrismaClient;

export async function ecosystemSnapshot(db: Db) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const service = serviceOfTheDay();

  const [orders, lives, blogs, events, feed] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: start } } }),
    db.liveMessage.count({
      where: { createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, body: { startsWith: "__SIG__" } },
    }),
    db.blogPost.count({ where: { publishedAt: { gte: start }, status: "PUBLISHED" } }),
    db.event.count({ where: { startAt: { gte: new Date() } } }),
    db.feedPost.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { title: true, caption: true, tags: true },
    }),
  ]);

  return {
    service,
    offers: CLOUDUS_SERVICES.map((item) => item.name).join(", "),
    orders,
    lives,
    blogs,
    events,
    headlines: feed
      .map((item) => item.title ?? item.caption ?? "")
      .filter(Boolean)
      .slice(0, 5),
  };
}
