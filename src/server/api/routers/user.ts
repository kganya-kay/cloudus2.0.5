import { z } from "zod";
import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { adminProcedure } from "../rbac";
import { isSuperAdminEmail } from "~/server/auth/super-admin";

const userIdParam = z.object({ id: z.string().cuid() });

const adminUpdateInput = z.object({
  id: z.string().cuid(),
  data: z
    .object({
      name: z.string().min(1).nullable().optional(),
      email: z.string().email().nullable().optional(),
      role: z.nativeEnum(Role).optional(),
      supplierId: z.string().cuid().nullable().optional(),
      driverId: z.string().cuid().nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "No fields to update.",
    }),
});

export const userRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) , email: z.string().min(5)}))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.create({
        data: {
          name: input.name,
          
          
          
          email: input.email,
          
        },
      });
    }),

  

  select: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const selectedUser = await ctx.db.user.findUnique({
      where: {id: input.id.toString()}
    });

    return selectedUser ?? null;
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const email = ctx.session.user.email ?? null;
    const role = ctx.session.user.role;
    const canView =
      role === Role.ADMIN ||
      role === Role.CARETAKER ||
      isSuperAdminEmail(email);
    if (!canView) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const users = await ctx.db.user.findMany({
      orderBy: { email: "asc" },
      include: {
        supplier: true,
        driver: true,
      },
    });

    return users ?? null;
  }),

  adminUpdate: adminProcedure
    .input(adminUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: { id: true, email: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      const actorEmail = ctx.session.user.email ?? null;
      const actorIsSuper = isSuperAdminEmail(actorEmail);
      const targetIsSuper = isSuperAdminEmail(target.email ?? null);

      if (targetIsSuper && !actorIsSuper) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot modify the super admin account.",
        });
      }

      const data: Parameters<typeof ctx.db.user.update>[0]["data"] = {};

      if (Object.prototype.hasOwnProperty.call(input.data, "name")) {
        data.name = input.data.name ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(input.data, "email")) {
        data.email = input.data.email ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(input.data, "role")) {
        data.role = input.data.role;
      }
      if (Object.prototype.hasOwnProperty.call(input.data, "supplierId")) {
        data.supplierId = input.data.supplierId ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(input.data, "driverId")) {
        data.driverId = input.data.driverId ?? null;
      }

      const updated = await ctx.db.user.update({
        where: { id: input.id },
        data,
      });
      return updated;
    }),

  adminDelete: adminProcedure
    .input(userIdParam)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account.",
        });
      }

      const target = await ctx.db.user.findUnique({
        where: { id: input.id },
        select: { id: true, email: true },
      });
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      if (isSuperAdminEmail(target.email ?? null)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete the super admin account.",
        });
      }

      await ctx.db.session.deleteMany({ where: { userId: input.id } });
      await ctx.db.account.deleteMany({ where: { userId: input.id } });

      return ctx.db.user.delete({
        where: { id: input.id },
      });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
