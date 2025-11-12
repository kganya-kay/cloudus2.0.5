// src/app/api/profile/self/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

const bodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  image: z.string().url().optional(),
  address: z
    .object({
      line1: z.string().min(1).max(200).optional(),
      suburb: z.string().min(1).max(120).optional(),
      city: z.string().min(1).max(120).optional(),
    })
    .optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;
  if (!userId || !email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { name, image, address } = parsed.data;

  await db.$transaction(async (tx) => {
    if (name !== undefined || image !== undefined) {
      await tx.user.update({ where: { id: userId }, data: { name, image } });
    }

    if (address && (address.line1 || address.suburb || address.city)) {
      // Upsert default HOME address for this user
      const existing = await tx.userAddress.findFirst({
        where: { userId, type: "HOME" },
        include: { address: true },
      });
      if (existing) {
        await tx.address.update({
          where: { id: existing.addressId },
          data: {
            line1: address.line1 ?? existing.address.line1,
            suburb: address.suburb ?? existing.address.suburb ?? undefined,
            city: address.city ?? existing.address.city,
          },
        });
      } else {
        const addr = await tx.address.create({
          data: {
            line1: address.line1 ?? "",
            city: address.city ?? "",
            suburb: address.suburb ?? undefined,
          },
        });
        await tx.userAddress.create({
          data: { userId, addressId: addr.id, type: "HOME", isDefault: true },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}

