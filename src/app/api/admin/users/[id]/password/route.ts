// src/app/api/admin/users/[id]/password/route.ts
import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { z } from "zod";
import { hashPassword } from "~/server/auth/password";

const bodySchema = z.object({ password: z.string().min(6).max(200) });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "CARETAKER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await _req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: params.id }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: params.id } }),
  ]);

  return NextResponse.json({ ok: true });
}

