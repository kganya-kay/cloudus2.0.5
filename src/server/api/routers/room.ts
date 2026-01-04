import { TRPCError } from "@trpc/server";
import {
  BookingStatus,
  PaymentStatus,
  RoomAdminStatus,
  RoomMediaType,
  RoomAvailabilityStatus,
  Role,
} from "@prisma/client";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

const addressInput = z.object({
  line1: z.string().min(3),
  line2: z.string().optional(),
  suburb: z.string().optional(),
  city: z.string().min(1),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("ZA"),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

const createRoomInput = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  nightlyRateCents: z.number().int().nonnegative(),
  monthlyRateCents: z.number().int().nonnegative().optional(),
  cleaningFeeCents: z.number().int().nonnegative().default(0),
  currency: z.string().default("ZAR"),
  maxGuests: z.number().int().positive().default(1),
  bedrooms: z.number().int().nonnegative().optional(),
  beds: z.number().int().nonnegative().optional(),
  bathrooms: z.number().nonnegative().optional(),
  amenities: z.array(z.string()).default([]),
  houseRules: z.array(z.string()).default([]),
  coverImage: z.string().url().optional(),
  gallery: z.array(z.string().url()).default([]),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  address: addressInput,
});

const listRoomsInput = z.object({
  take: z.number().int().min(1).max(50).default(12),
  cursor: z.string().optional(),
  query: z.string().trim().optional(),
});

const bookingInput = z.object({
  roomId: z.string().min(1),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  guests: z.number().int().positive().default(1),
  totalCents: z.number().int().nonnegative(),
  cleaningFeeCents: z.number().int().nonnegative().default(0),
  taxCents: z.number().int().nonnegative().default(0),
  currency: z.string().default("ZAR"),
  provider: z.string().default("PAYSTACK"),
});

export const roomRouter = createTRPCRouter({
  list: publicProcedure
    .input(listRoomsInput)
    .query(async ({ ctx, input }) => {
      const rooms = await ctx.db.roomListing.findMany({
        take: input.take + 1,
        skip: input.cursor ? 1 : 0,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          AND: [
            input.query
              ? {
                  OR: [
                    { title: { contains: input.query, mode: "insensitive" } },
                    {
                      description: {
                        contains: input.query,
                        mode: "insensitive",
                      },
                    },
                    {
                      address: {
                        city: { contains: input.query, mode: "insensitive" },
                      },
                    },
                  ],
                }
              : {},
            { adminStatus: RoomAdminStatus.APPROVED },
            { isActive: true },
          ],
        },
        include: {
          address: true,
          host: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined = undefined;
      if (rooms.length > input.take) {
        const next = rooms.pop();
        nextCursor = next?.id;
      }

      return { rooms, nextCursor };
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const room = await ctx.db.roomListing.findUnique({
        where: { id: input.id },
        include: {
          address: true,
          host: { select: { id: true, name: true, image: true, email: true } },
          media: true,
          availability: true,
        },
      });
      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }
      return room;
    }),

  create: protectedProcedure
    .input(createRoomInput)
    .mutation(async ({ ctx, input }) => {
      const addr = await ctx.db.address.create({
        data: {
          line1: input.address.line1,
          line2: input.address.line2,
          suburb: input.address.suburb,
          city: input.address.city,
          province: input.address.province,
          postalCode: input.address.postalCode,
          country: input.address.country ?? "ZA",
          lat: input.address.lat,
          lng: input.address.lng,
        },
      });

      const coverImage =
        input.coverImage ??
        input.gallery[0] ??
        "https://utfs.io/f/zFJP5UraSTwK07wECkD6zpt79ehTVJxMrYIoKdqLl2gOj1Zf";

      const room = await ctx.db.roomListing.create({
        data: {
          title: input.title,
          description: input.description,
          nightlyRateCents: input.nightlyRateCents,
          monthlyRateCents: input.monthlyRateCents,
          cleaningFeeCents: input.cleaningFeeCents,
          currency: input.currency,
          maxGuests: input.maxGuests,
          bedrooms: input.bedrooms ?? 0,
          beds: input.beds ?? 0,
          bathrooms: input.bathrooms ?? 0,
          amenities: input.amenities ?? [],
          houseRules: input.houseRules ?? [],
          coverImage,
          gallery: input.gallery ?? [],
          lat: input.lat ?? input.address.lat,
          lng: input.lng ?? input.address.lng,
          hostId: ctx.session.user.id,
          addressId: addr.id,
          adminStatus: RoomAdminStatus.PENDING,
        },
      });

      if (input.gallery?.length) {
        await ctx.db.roomMedia.createMany({
          data: input.gallery.map((url, idx) => ({
            roomId: room.id,
            url,
            type: RoomMediaType.IMAGE,
            position: idx,
          })),
        });
      }

      return room;
    }),

  book: protectedProcedure
    .input(bookingInput)
    .mutation(async ({ ctx, input }) => {
      if (input.checkOut <= input.checkIn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Check-out must be after check-in.",
        });
      }

      const room = await ctx.db.roomListing.findUnique({
        where: { id: input.roomId },
        select: { id: true, hostId: true, maxGuests: true, title: true },
      });

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      if (input.guests > room.maxGuests) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Max guests for this listing is ${room.maxGuests}.`,
        });
      }

      const overlap = await ctx.db.booking.findFirst({
        where: {
          roomId: input.roomId,
          status: {
            in: [
              BookingStatus.PENDING,
              BookingStatus.CONFIRMED,
              BookingStatus.COMPLETED,
            ],
          },
          NOT: {
            OR: [
              { checkOut: { lte: input.checkIn } },
              { checkIn: { gte: input.checkOut } },
            ],
          },
        },
      });

      if (overlap) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This room is already booked for the selected dates.",
        });
      }

      const booking = await ctx.db.booking.create({
        data: {
          roomId: input.roomId,
          guestId: ctx.session.user.id,
          hostId: room.hostId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guests: input.guests,
          status: BookingStatus.PENDING,
          totalCents: input.totalCents,
          cleaningFeeCents: input.cleaningFeeCents,
          taxCents: input.taxCents,
          currency: input.currency,
        },
      });

      await ctx.db.bookingPayment.create({
        data: {
          bookingId: booking.id,
          amountCents: input.totalCents,
          currency: input.currency,
          status: PaymentStatus.PENDING,
          provider: input.provider,
        },
      });

      return booking;
    }),

  availability: protectedProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        status: z.nativeEnum(RoomAvailabilityStatus).default(
          RoomAvailabilityStatus.BLOCKED
        ),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.endDate <= input.startDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date.",
        });
      }

      const room = await ctx.db.roomListing.findUnique({
        where: { id: input.roomId },
        select: { hostId: true },
      });

      if (!room || room.hostId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.roomAvailability.create({
        data: {
          roomId: input.roomId,
          startDate: input.startDate,
          endDate: input.endDate,
          status: input.status,
          reason: input.reason,
        },
      });
    }),

  myHostBookings: protectedProcedure.query(({ ctx }) => {
    return ctx.db.booking.findMany({
      where: { hostId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { room: true, guest: { select: { id: true, name: true } } },
    });
  }),

  myGuestBookings: protectedProcedure.query(({ ctx }) => {
    return ctx.db.booking.findMany({
      where: { guestId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: { room: true, host: { select: { id: true, name: true } } },
    });
  }),

  adminList: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(RoomAdminStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== Role.ADMIN) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.roomListing.findMany({
        where: {
          ...(input.status ? { adminStatus: input.status } : {}),
        },
        include: {
          host: { select: { id: true, name: true, email: true } },
          address: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  setStatus: protectedProcedure
    .input(
      z.object({
        roomId: z.string().min(1),
        status: z.nativeEnum(RoomAdminStatus).default(RoomAdminStatus.APPROVED),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== Role.ADMIN) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.roomListing.update({
        where: { id: input.roomId },
        data: { adminStatus: input.status },
      });
    }),
});
