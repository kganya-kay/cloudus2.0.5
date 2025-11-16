import { Prisma, Role, type FulfilmentStatus, PaymentStatus } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

type SessionUser = {
  id: string;
  role: Role;
  email?: string | null;
};

type Ctx = {
  db: PrismaClient;
  session?: { user?: SessionUser | null } | null;
};

type NotificationInput = {
  userId: string | null | undefined;
  type: string;
  title: string;
  body: string;
  data?: Prisma.JsonValue;
};

const toMoney = (cents?: number | null, currency = "ZAR") => {
  const amount = typeof cents === "number" ? cents / 100 : 0;
  const symbol = currency === "ZAR" ? "R" : "";
  return `${symbol}${amount.toFixed(2)} ${currency}`;
};

export async function createNotifications(ctx: Ctx, entries: NotificationInput[]) {
  const dedup = new Map<string, NotificationInput>();
  for (const entry of entries) {
    if (!entry.userId) continue;
    const key = `${entry.userId}:${entry.type}:${entry.title}:${entry.body}`;
    if (!dedup.has(key)) {
      dedup.set(key, entry);
    }
  }
  const payload = Array.from(dedup.values()).map((entry) => ({
    userId: entry.userId!,
    type: entry.type,
    title: entry.title,
    body: entry.body,
    data: entry.data ?? Prisma.JsonNull,
  }));
  if (!payload.length) return;
  await ctx.db.notification.createMany({ data: payload });
}

export async function getAdminUserIds(ctx: Ctx) {
  const admins = await ctx.db.user.findMany({
    where: { role: { in: [Role.ADMIN, Role.CARETAKER] } },
    select: { id: true },
  });
  return admins.map((u) => u.id);
}

export async function getSupplierUserIds(ctx: Ctx, supplierId?: string | null) {
  if (!supplierId) return [];
  const rows = await ctx.db.user.findMany({
    where: { supplierId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function getDriverUserIds(ctx: Ctx, driverId?: string | null) {
  if (!driverId) return [];
  const rows = await ctx.db.user.findMany({
    where: { driverId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function resolveOrderStakeholders(ctx: Ctx, orderId: number) {
  const order = await ctx.db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      createdById: true,
      customerName: true,
      customerPhone: true,
      supplierId: true,
      caretakerId: true,
      delivery: { select: { driverId: true } },
    },
  });
  if (!order) return null;
  const [adminIds, supplierUserIds, driverUserIds] = await Promise.all([
    getAdminUserIds(ctx),
    getSupplierUserIds(ctx, order.supplierId),
    getDriverUserIds(ctx, order.delivery?.driverId ?? null),
  ]);
  return {
    order,
    adminIds,
    supplierUserIds,
    driverUserIds,
    customerId: order.createdById,
  };
}

const statusNextStep: Partial<Record<FulfilmentStatus, string>> = {
  NEW: "We'll confirm the supplier shortly.",
  SOURCING_SUPPLIER: "We're sourcing the best supplier for this order.",
  SUPPLIER_CONFIRMED: "The supplier is confirmed and preparing your order.",
  IN_PROGRESS: "Work is underway.",
  READY_FOR_DELIVERY: "Order is packed and ready for delivery.",
  OUT_FOR_DELIVERY: "Driver is on the way.",
  DELIVERED: "Order has been delivered.",
  CLOSED: "Order is closed. Thank you!",
  CANCELED: "The order was canceled. Contact support if this is unexpected.",
};

export async function notifyOrderCreated(ctx: Ctx, orderId: number) {
  const stakeholders = await resolveOrderStakeholders(ctx, orderId);
  if (!stakeholders) return;
  const { order, adminIds, supplierUserIds, customerId } = stakeholders;
  const title = `New order ${order.code}`;
  await createNotifications(ctx, [
    ...adminIds.map((id) => ({
      userId: id,
      type: "order:new",
      title,
      body: `${order.customerName ?? "Customer"} placed an order. Review and assign a supplier.`,
      data: { orderId },
    })),
    ...(customerId
      ? [
          {
            userId: customerId,
            type: "order:new",
            title: "Order received",
            body: `We've received your order ${order.code}. Track progress from your dashboard.`,
            data: { orderId },
          },
        ]
      : []),
    ...supplierUserIds.map((id) => ({
      userId: id,
      type: "order:assigned",
      title: `Order ${order.code} assigned`,
      body: "Review the details and update the status when work begins.",
      data: { orderId },
    })),
  ]);
}

export async function notifyOrderStatusChanged(
  ctx: Ctx,
  orderId: number,
  status: FulfilmentStatus,
) {
  const stakeholders = await resolveOrderStakeholders(ctx, orderId);
  if (!stakeholders) return;
  const { order, customerId, supplierUserIds, driverUserIds, adminIds } = stakeholders;
  const human = status.replaceAll("_", " ").toLowerCase();
  const next = statusNextStep[status] ?? "We'll keep you posted on the next steps.";
  const title = `Order ${order.code} is now ${human}`;
  const notif = [];
  if (customerId) {
    notif.push({
      userId: customerId,
      type: "order:status",
      title,
      body: next,
      data: { orderId, status },
    });
  }
  supplierUserIds.forEach((id) =>
    notif.push({
      userId: id,
      type: "order:status",
      title,
      body: `Update the portal if anything changes. ${next}`,
      data: { orderId, status },
    }),
  );
  driverUserIds.forEach((id) =>
    notif.push({
      userId: id,
      type: "order:status",
      title,
      body: `Check your driver dashboard for the latest instructions.`,
      data: { orderId, status },
    }),
  );
  adminIds.forEach((id) =>
    notif.push({
      userId: id,
      type: "order:status",
      title,
      body: `Keep the customer updated if needed.`,
      data: { orderId, status },
    }),
  );
  await createNotifications(ctx, notif);
}

export async function notifyDriverAssignment(
  ctx: Ctx,
  orderId: number,
  driverId: string | null,
) {
  if (!driverId) return;
  const driverUserIds = await getDriverUserIds(ctx, driverId);
  if (!driverUserIds.length) return;
  const order = await ctx.db.order.findUnique({
    where: { id: orderId },
    select: { code: true },
  });
  if (!order) return;
  await createNotifications(ctx, driverUserIds.map((id) => ({
    userId: id,
    type: "order:driver_assignment",
    title: `Delivery assigned: ${order.code}`,
    body: "Open your driver portal to confirm pickup and delivery windows.",
    data: { orderId },
  })));
}

export async function notifyPaymentUpdate(
  ctx: Ctx,
  orderId: number,
  status: PaymentStatus,
  amountCents: number,
  provider: string,
) {
  const stakeholders = await resolveOrderStakeholders(ctx, orderId);
  if (!stakeholders) return;
  const { order, customerId, adminIds } = stakeholders;
  const message = `Payment ${status.toLowerCase()} via ${provider}. Amount ${toMoney(amountCents)}.`;
  const notifications: NotificationInput[] = [
    ...adminIds.map((id) => ({
      userId: id,
      type: "payment:update",
      title: `Payment update for ${order.code}`,
      body: message,
      data: { orderId, status },
    })),
  ];
  if (customerId) {
    notifications.push({
      userId: customerId,
      type: "payment:update",
      title: `Payment ${status.toLowerCase()}`,
      body:
        status === PaymentStatus.FAILED
          ? `Payment issue detected. Please update your payment method.`
          : status === PaymentStatus.REFUNDED
            ? `We've processed a refund of ${toMoney(amountCents)} for order ${order.code}.`
            : `We've logged your payment for order ${order.code}.`,
      data: { orderId, status },
    });
  }
  await createNotifications(ctx, notifications);
}

export async function notifyPayoutUpdate(
  ctx: Ctx,
  orderId: number,
  status: string,
  amountCents: number,
) {
  const stakeholders = await resolveOrderStakeholders(ctx, orderId);
  if (!stakeholders) return;
  const { order, supplierUserIds, adminIds } = stakeholders;
  if (!supplierUserIds.length) return;
  const title =
    status === "RELEASED"
      ? `Payout released for ${order.code}`
      : status === "FAILED"
        ? `Payout issue for ${order.code}`
        : `Payout requested for ${order.code}`;
  const supplierMessage =
    status === "RELEASED"
      ? `We've released ${toMoney(amountCents)}. Check your bank within 1-2 days.`
      : status === "FAILED"
        ? `Your payout failed. Please confirm your banking details with support.`
        : `A payout of ${toMoney(amountCents)} is pending approval.`;
  await createNotifications(ctx, [
    ...supplierUserIds.map((id) => ({
      userId: id,
      type: "payout:update",
      title,
      body: supplierMessage,
      data: { orderId, status },
    })),
    ...adminIds.map((id) => ({
      userId: id,
      type: "payout:update",
      title,
      body: `Supplier notified: ${supplierMessage}`,
      data: { orderId, status },
    })),
  ]);
}

export async function notifyProjectBidDecision(
  ctx: Ctx,
  params: {
    projectId: number;
    userId: string;
    status: "APPROVED" | "REJECTED";
    taskCount: number;
    amountCents: number;
  },
) {
  const project = await ctx.db.project.findUnique({
    where: { id: params.projectId },
    select: { name: true },
  });
  if (!project) return;
  const approved = params.status === "APPROVED";
  await createNotifications(ctx, [
    {
      userId: params.userId,
      type: "project:bid",
      title: approved
        ? `Bid approved on ${project.name}`
        : `Bid update for ${project.name}`,
      body: approved
        ? `You're cleared to collaborate on ${params.taskCount} tasks. Estimated payout ${toMoney(params.amountCents)}.`
        : `Your bid was not approved this round. Keep an eye on new drops.`,
      data: { projectId: params.projectId, status: params.status },
    },
  ]);
}

export async function notifyProjectPayoutRequest(
  ctx: Ctx,
  params: {
    projectId: number;
    ownerId: string;
    taskTitle: string;
    amountCents: number;
  },
) {
  const project = await ctx.db.project.findUnique({
    where: { id: params.projectId },
    select: { name: true },
  });
  if (!project) return;
  await createNotifications(ctx, [
    {
      userId: params.ownerId,
      type: "project:payout_request",
      title: `Payout requested · ${project.name}`,
      body: `${params.taskTitle} submitted ${toMoney(params.amountCents)} for approval.`,
      data: { projectId: params.projectId },
    },
  ]);
}

export async function notifyProjectPayoutUpdate(
  ctx: Ctx,
  params: {
    projectId: number;
    contributorId: string;
    taskTitle: string;
    amountCents: number;
    status: "APPROVED" | "REJECTED";
  },
) {
  const project = await ctx.db.project.findUnique({
    where: { id: params.projectId },
    select: { name: true },
  });
  if (!project) return;
  await createNotifications(ctx, [
    {
      userId: params.contributorId,
      type: "project:payout",
      title: `Payout ${params.status.toLowerCase()} for ${project.name}`,
      body:
        params.status === "APPROVED"
          ? `We're releasing ${toMoney(params.amountCents)} for ${params.taskTitle}.`
          : `Payout for ${params.taskTitle} needs edits. Check the project for notes.`,
      data: { projectId: params.projectId, status: params.status },
    },
  ]);
}

export async function notifyProjectCollaboration(
  ctx: Ctx,
  params: {
    projectId: number;
    ownerId: string;
    collaboratorId: string;
    taskTitle: string;
  },
) {
  const [project, collaborator] = await Promise.all([
    ctx.db.project.findUnique({ where: { id: params.projectId }, select: { name: true } }),
    ctx.db.user.findUnique({ where: { id: params.collaboratorId }, select: { name: true } }),
  ]);
  if (!project || !collaborator) return;
  await createNotifications(ctx, [
    {
      userId: params.ownerId,
      type: "project:collaboration",
      title: `${collaborator.name ?? "Contributor"} joined ${project.name}`,
      body: `${collaborator.name ?? "Contributor"} is now working on ${params.taskTitle}.`,
      data: { projectId: params.projectId },
    },
  ]);
}
