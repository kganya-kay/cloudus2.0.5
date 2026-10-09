import { generateText } from "ai";

import { fallbackSocialCaption } from "~/lib/social/caption";
import type { SocialChannel } from "~/lib/outreach/channels";
import type { ecosystemSnapshot } from "./snapshot";

type Snapshot = Awaited<ReturnType<typeof ecosystemSnapshot>>;

const voice: Record<SocialChannel, string> = {
  LINKEDIN:
    "You write a LinkedIn post for Cloudus, a South African creative OS. One hook. Three short lines of proof from the snapshot. No hype. No invented metrics. End with one quiet CTA to /services.",
  FACEBOOK:
    "You write a Facebook post for Cloudus. Warm, local, specific. Use only facts in the snapshot. Invite a reply. Include the permalink.",
  INSTAGRAM:
    "You write an Instagram caption. Two to four short lines. Quiet hashtags on the last line. No invented facts. Permalink on its own line.",
};

export async function craftChannelPost(channel: SocialChannel, snapshot: Snapshot, permalink: string) {
  const fallback = fallbackSocialCaption({
    title: snapshot.service.name,
    excerpt: `${snapshot.orders} orders · ${snapshot.blogs} chapters · ${snapshot.events} nights`,
    permalink,
  });
  try {
    const { text } = await generateText({
      model: "openai/gpt-5",
      temperature: 0.4,
      system: voice[channel],
      prompt: JSON.stringify({
        service: snapshot.service,
        offers: snapshot.offers,
        orders: snapshot.orders,
        lives: snapshot.lives,
        blogs: snapshot.blogs,
        events: snapshot.events,
        headlines: snapshot.headlines,
        permalink,
      }),
    });
    const body = text?.trim().replace(/^["']|["']$/g, "");
    return body && body.length > 12 ? body.slice(0, channel === "INSTAGRAM" ? 2100 : 2800) : fallback;
  } catch {
    return fallback;
  }
}

export async function craftCampaignMail(input: {
  city: string;
  serviceName: string;
  brief: string;
  businessName: string;
}) {
  const fallback = {
    subject: `${input.serviceName} · ${input.city}`,
    body: `${input.businessName},\n\nCloudus runs ${input.serviceName} as a live service. ${input.brief}\n\nIf this is useful, tap the link — that is the only ask.`,
  };
  try {
    const { text } = await generateText({
      model: "openai/gpt-5",
      temperature: 0.3,
      system:
        "Write a short B2B email from Cloudus. Subject on the first line prefixed Subject:. Then a body under 120 words. POPIA-aware, no scraping language, one CTA. Do not invent case studies.",
      prompt: JSON.stringify(input),
    });
    const raw = text?.trim() ?? "";
    const subjectLine = raw.match(/^Subject:\s*(.+)$/im)?.[1]?.trim();
    const body = raw.replace(/^Subject:.*$/im, "").trim();
    if (subjectLine && body.length > 40) return { subject: subjectLine.slice(0, 120), body: body.slice(0, 4000) };
    return fallback;
  } catch {
    return fallback;
  }
}
