import { LeadInterest, OutreachChannel } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "~/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pixel = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64",
);

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t");
  if (token) {
    const lead = await db.campaignLead.findUnique({ where: { token } });
    if (lead && lead.interest !== LeadInterest.UNSUBSCRIBED) {
      await db.campaignLead.update({
        where: { id: lead.id },
        data: {
          interest: lead.interest === LeadInterest.UNKNOWN ? LeadInterest.OPENED : lead.interest,
          score: { increment: 1 },
          lastTouchedAt: new Date(),
        },
      });
      await db.campaignTouch.create({
        data: {
          campaignId: lead.campaignId,
          leadId: lead.id,
          channel: OutreachChannel.EMAIL,
          kind: "OPEN",
          status: "TRACKED",
          openedAt: new Date(),
        },
      });
    }
  }
  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}
