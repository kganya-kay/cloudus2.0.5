// server/api/routers/ops.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { caretakerProcedure } from "../rbac";

export const opsRouter = createTRPCRouter({
  createOrder: publicProcedure.input(z.object({
    customerName: z.string(),
    customerPhone: z.string(),
    customerEmail: z.string().email().optional(),
    addressLine1: z.string(),
    suburb: z.string(),
    city: z.string(),
    estimatedKg: z.number().positive().optional(),
    priceCents: z.number().int().positive(),
    deliveryCents: z.number().int().nonnegative().default(0),
  })).mutation(async ({ ctx, input }) => {
    // generate short code, persist, enqueue notifications
    // return { orderId, code }
  }),

  requestQuotes: caretakerProcedure.input(z.object({
    orderId: z.string(),
    supplierIds: z.array(z.string()).min(1),
  })).mutation(async ({ ctx, input }) => {
    // create SupplierQuote requests; notify suppliers (WhatsApp/email)
  }),

  acceptQuote: caretakerProcedure.input(z.object({
    orderId: z.string(),
    supplierId: z.string(),
    amountCents: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    // set order.supplierId + move status to SUPPLIER_CONFIRMED
  }),

  advanceStatus: caretakerProcedure.input(z.object({
    orderId: z.string(),
    to: z.enum([
      "SOURCING_SUPPLIER","SUPPLIER_CONFIRMED","IN_PROGRESS",
      "READY_FOR_DELIVERY","OUT_FOR_DELIVERY","DELIVERED","CLOSED","CANCELED"
    ]),
    note: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    // update status, write AuditLog, notify customer
  }),

  releasePayout: caretakerProcedure.input(z.object({
    orderId: z.string(),
    amountCents: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    // call payment provider transfer; mark SupplierPayout RELEASED
  }),

  listToday: caretakerProcedure.query(async ({ ctx }) => {
    // return orders for today for caretaker dashboard
  }),
});
