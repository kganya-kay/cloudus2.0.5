import { NextResponse } from "next/server";

import { db } from "~/server/db";
import { runOrchestration } from "~/server/outreach/orchestrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  if (request.headers.get("x-vercel-cron") === "1") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runOrchestration(db);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
