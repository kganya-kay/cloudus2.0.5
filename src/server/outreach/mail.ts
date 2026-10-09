import sgMail from "@sendgrid/mail";
import { LeadInterest, OutreachChannel, type PrismaClient } from "@prisma/client";

import { env } from "~/env";
import { getService } from "~/lib/revenue/catalog";
import { craftCampaignMail } from "./craft";

type Db = PrismaClient;

function fromAddress() {
  return process.env.SENDGRID_FROM_EMAIL?.trim() || "info@cloudusdigital.com";
}

function origin() {
  return env.AUTH_URL ?? "https://cloudusdigital.com";
}

export function campaignHtml(input: {
  name: string;
  body: string;
  href: string;
  stop: string;
  token: string;
}) {
  const text = input.body.replace(/</g, "&lt;").replace(/\n/g, "<br/>");
  return `<!doctype html><html><body style="font-family:Georgia,serif;background:#f6f1e4;color:#1a1714;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fffaf0;border:1px solid #d9c7a2;padding:28px">
    <p style="letter-spacing:.2em;font-size:11px">CLOUDUS</p>
    <p>${text}</p>
    <p><a href="${input.href}" style="color:#6b1d2a">${input.href}</a></p>
    <img src="${origin()}/api/outreach/open?t=${encodeURIComponent(input.token)}" width="1" height="1" alt="" />
    <p style="font-size:12px;color:#6b645c"><a href="${input.stop}">Unsubscribe</a></p>
  </div></body></html>`;
}

export async function sendDueCampaignMail(db: Db, limit = 25) {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (!key) return { sent: 0, skipped: true };
  sgMail.setApiKey(key);

  const leads = await db.campaignLead.findMany({
    where: {
      email: { not: null },
      interest: { notIn: [LeadInterest.UNSUBSCRIBED] },
      campaign: { status: "ACTIVE" },
      touches: { none: { kind: "EMAIL", status: "SENT" } },
    },
    include: { campaign: true },
    take: limit,
  });

  let sent = 0;
  for (const lead of leads) {
    if (!lead.email) continue;
    const service = getService(lead.campaign.serviceSlug);
    const crafted = await craftCampaignMail({
      city: lead.campaign.city,
      serviceName: service?.name ?? lead.campaign.serviceSlug,
      brief: lead.campaign.brief,
      businessName: lead.name,
    });
    const href = `${origin()}/i/${lead.token}`;
    const stop = `${origin()}/i/${lead.token}/stop`;
    try {
      await sgMail.send({
        to: lead.email,
        from: fromAddress(),
        subject: lead.campaign.emailSubject || crafted.subject,
        text: `${crafted.body}\n\n${href}\n\nUnsubscribe: ${stop}`,
        html: campaignHtml({
          name: lead.name,
          body: lead.campaign.emailBody || crafted.body,
          href,
          stop,
          token: lead.token,
        }),
      });
      await db.campaignTouch.create({
        data: {
          campaignId: lead.campaignId,
          leadId: lead.id,
          channel: OutreachChannel.EMAIL,
          kind: "EMAIL",
          status: "SENT",
          subject: crafted.subject,
          body: crafted.body,
          sentAt: new Date(),
        },
      });
      await db.campaignLead.update({
        where: { id: lead.id },
        data: { lastTouchedAt: new Date(), score: { increment: 1 } },
      });
      sent += 1;
    } catch (error) {
      await db.campaignTouch.create({
        data: {
          campaignId: lead.campaignId,
          leadId: lead.id,
          channel: OutreachChannel.EMAIL,
          kind: "EMAIL",
          status: "FAILED",
          body: error instanceof Error ? error.message : "send failed",
        },
      });
    }
  }

  return { sent, skipped: false };
}
