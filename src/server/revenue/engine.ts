import { FulfilmentStatus, Role } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import { fallbackSocialCaption } from "~/lib/social/caption";
import { SUPER_ADMIN_EMAILS } from "~/server/auth/super-admin";
import {
  CLOUDUS_SERVICES,
  getService,
  orderProjectKey,
  parseServiceKey,
  serviceKey,
  serviceOfTheDay,
  type CloudusService,
  type ServiceSlug,
} from "~/lib/revenue/catalog";
import { createNotifications, getAdminUserIds, notifyOrderCreated } from "~/server/api/notification-service";
import { craftSocialCaption } from "~/server/social/craft-caption";

type Db = PrismaClient;

async function operatorId(db: Db) {
  const user = await db.user.findFirst({
    where: {
      OR: [
        { role: { in: [Role.ADMIN, Role.CARETAKER] } },
        { email: { in: [...SUPER_ADMIN_EMAILS] } },
      ],
    },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  return user?.id ?? null;
}

async function operatorProfile(db: Db, ownerId: string) {
  const existing = await db.creatorProfile.findUnique({
    where: { userId: ownerId },
  });
  if (existing) return existing;
  const handle = `c${ownerId.replace(/[^a-z0-9]/gi, "").slice(0, 24) || "loudus"}`;
  try {
    return await db.creatorProfile.create({
      data: {
        userId: ownerId,
        handle,
        displayName: "Cloudus",
      },
    });
  } catch {
    return db.creatorProfile.findUniqueOrThrow({ where: { userId: ownerId } });
  }
}

export async function ensureServiceStore(db: Db) {
  const ownerId = await operatorId(db);
  if (!ownerId) return { created: 0, items: [] as Array<{ slug: ServiceSlug; itemId: number }> };

  const items: Array<{ slug: ServiceSlug; itemId: number }> = [];
  let created = 0;

  for (const service of CLOUDUS_SERVICES) {
    const key = serviceKey(service.slug);
    const existing = await db.shopItem.findFirst({
      where: { api: key },
      select: { id: true },
    });
    if (existing) {
      items.push({ slug: service.slug, itemId: existing.id });
      continue;
    }
    const row = await db.shopItem.create({
      data: {
        name: service.name,
        description: `Cloudus ${service.name} on ${service.href}`,
        type: service.type,
        price: service.priceCents,
        stock: 99,
        link: service.href,
        api: key,
        links: [service.href],
        createdBy: { connect: { id: ownerId } },
      },
      select: { id: true },
    });
    created += 1;
    items.push({ slug: service.slug, itemId: row.id });
  }

  return { created, items };
}

export async function hireService(
  db: Db,
  input: {
    slug: ServiceSlug;
    name: string;
    email: string;
    phone?: string;
    note?: string;
  },
) {
  const service = getService(input.slug);
  if (!service) return null;

  const store = await ensureServiceStore(db);
  const itemId = store.items.find((item) => item.slug === service.slug)?.itemId;
  if (!itemId) return null;

  const guest = await db.user.upsert({
    where: { email: input.email },
    update: { name: input.name },
    create: {
      email: input.email,
      name: input.name,
      role: Role.CUSTOMER,
    },
    select: { id: true },
  });

  const order = await db.order.create({
    data: {
      name: `${service.name} · ${input.name}`,
      description: input.note?.trim() || `${service.name} for ${input.email}`,
      price: service.priceCents,
      link: service.href,
      api: serviceKey(service.slug),
      links: [service.href, `/hire?s=${service.slug}`],
      createdBy: { connect: { id: guest.id } },
      createdFor: { connect: { id: itemId } },
      customerName: input.name,
      customerEmail: input.email,
      customerPhone: input.phone,
    },
    select: { id: true, code: true, price: true },
  });

  await notifyOrderCreated({ db }, order.id);

  return {
    orderId: order.id,
    code: order.code,
    itemId,
    href: service.href,
    priceCents: order.price,
    slug: service.slug,
  };
}

export async function fulfillPaidOrder(db: Db, orderId: number) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      customerName: true,
      customerEmail: true,
      createdById: true,
      createdForId: true,
      api: true,
      createdFor: { select: { api: true, name: true, image: true } },
    },
  });
  if (!order) return null;

  const resolved =
    parseServiceKey(order.createdFor?.api) ?? parseServiceKey(order.api);
  if (!resolved) return null;

  const existing = await db.project.findFirst({
    where: { api: orderProjectKey(order.id) },
    select: { id: true },
  });
  if (existing) return { projectId: existing.id, created: false as const };

  const ownerId = (await operatorId(db)) ?? order.createdById;
  const title = `${resolved.name} · ${order.customerName ?? order.name}`;
  const project = await db.project.create({
    data: {
      name: title.slice(0, 160),
      description: order.description || `${resolved.name} for ${order.customerEmail ?? "client"}`,
      type: resolved.type,
      category: resolved.slug,
      tags: ["cloudus", resolved.slug],
      price: order.price,
      link: resolved.href,
      api: orderProjectKey(order.id),
      image: order.createdFor?.image,
      createdBy: { connect: { id: ownerId } },
      tasks: {
        create: resolved.tasks.map((task, index) => ({
          title: task,
          description: `${resolved.name} ${index + 1}`,
          budgetCents: Math.max(10_000, Math.round(order.price / resolved.tasks.length)),
        })),
      },
    },
    select: { id: true },
  });

  if (resolved.slug === "events") {
    const start = new Date();
    start.setDate(start.getDate() + 7);
    await db.event.create({
      data: {
        name: title.slice(0, 160),
        description: order.description,
        startAt: start,
        location: "Cloudus",
        status: "Scheduled",
        projectId: project.id,
        hostId: ownerId,
        createdById: ownerId,
      },
    });
  }

  if (resolved.slug === "blog") {
    const blog = await db.blog.findFirst({
      where: { ownerId },
      select: { id: true },
    });
    if (blog) {
      await db.blogPost.create({
        data: {
          blogId: blog.id,
          authorId: ownerId,
          slug: `kickoff-${order.id}`,
          title: title.slice(0, 160),
          content: order.description || resolved.name,
          excerpt: resolved.name,
          status: "DRAFT",
        },
      });
    }
  }

  await db.order.update({
    where: { id: order.id },
    data: { status: FulfilmentStatus.IN_PROGRESS, caretakerId: ownerId },
  });

  const profile = await operatorProfile(db, ownerId);
  const caption = fallbackSocialCaption({
    title,
    excerpt: `Open ${resolved.href}`,
    permalink: `/hire?s=${resolved.slug}`,
  });

  await db.feedPost.create({
    data: {
      creatorId: profile.id,
      projectId: project.id,
      orderId: order.id,
      shopItemId: order.createdForId,
      type: "PROJECT_UPDATE",
      title: resolved.name,
      caption,
      tags: ["hire", resolved.slug],
      visibility: "PUBLIC",
    },
  });

  const admins = await getAdminUserIds({ db });
  await createNotifications(
    { db },
    [
      ...admins.map((userId) => ({
        userId,
        type: "REVENUE_FULFIL",
        title: resolved.name,
        body: title,
        data: { orderId: order.id, projectId: project.id, href: resolved.href },
      })),
      {
        userId: order.createdById,
        type: "REVENUE_FULFIL",
        title: resolved.name,
        body: resolved.href,
        data: { orderId: order.id, projectId: project.id, href: resolved.href },
      },
    ],
  );

  await db.auditLog.create({
    data: {
      orderId: order.id,
      actorId: ownerId,
      action: "CLOUDUS_FULFIL",
      payload: { projectId: project.id, slug: resolved.slug },
    },
  });

  return { projectId: project.id, created: true as const };
}

export async function afterShopPaymentPaid(db: Db, paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { orderId: true, status: true },
  });
  if (!payment || payment.status !== "PAID") return null;
  try {
    return await fulfillPaidOrder(db, payment.orderId);
  } catch (error) {
    console.error(`Cloudus fulfil failed for order ${payment.orderId}`, error);
    return null;
  }
}

export async function pulsePresence(db: Db, service?: CloudusService) {
  const ownerId = await operatorId(db);
  if (!ownerId) return { posted: 0, slug: null as ServiceSlug | null };

  await ensureServiceStore(db);
  const pick = service ?? serviceOfTheDay();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const recent = await db.feedPost.count({
    where: {
      publishedAt: { gte: start },
      tags: { hasEvery: ["presence", pick.slug] },
    },
  });
  if (recent > 0) return { posted: 0, slug: pick.slug };

  const profile = await operatorProfile(db, ownerId);
  const permalink = `/hire?s=${pick.slug}`;
  const caption = await craftSocialCaption({
    title: pick.name,
    excerpt: pick.href,
    permalink,
  });

  await db.feedPost.create({
    data: {
      creatorId: profile.id,
      type: "ANNOUNCEMENT",
      title: pick.name,
      caption,
      tags: ["hire", pick.slug, "presence"],
      visibility: "PUBLIC",
    },
  });

  return { posted: 1, slug: pick.slug };
}

export async function listPipeline(db: Db) {
  const orders = await db.order.findMany({
    where: {
      OR: [
        { api: { startsWith: "cloudus:" } },
        { createdFor: { api: { startsWith: "cloudus:" } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      name: true,
      status: true,
      price: true,
      customerName: true,
      createdAt: true,
      api: true,
      createdFor: { select: { api: true, name: true } },
      payments: {
        select: { status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return orders.map((order) => ({
    ...order,
    slug: parseServiceKey(order.createdFor?.api ?? order.api)?.slug ?? null,
    paid: order.payments[0]?.status === "PAID",
  }));
}
