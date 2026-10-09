import { LeadInterest, type PrismaClient } from "@prisma/client";

import { isPersonalMailbox } from "~/lib/outreach/channels";

type Db = PrismaClient;

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const UA = "CloudusOS/1.0 (info@cloudusdigital.com)";

export async function geocodeCity(city: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", city);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  const response = await fetch(url, { headers: { "User-Agent": UA } });
  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ lat: string; lon: string }>;
  const first = rows[0];
  if (!first) return null;
  return { lat: Number(first.lat), lng: Number(first.lon) };
}

async function overpass(lat: number, lng: number, radiusM: number) {
  const query = `[out:json][timeout:25];(nwr(around:${radiusM},${lat},${lng})[shop];nwr(around:${radiusM},${lat},${lng})[office];nwr(around:${radiusM},${lat},${lng})[craft];);out center 40;`;
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) return [] as OsmElement[];
  const json = (await response.json()) as { elements?: OsmElement[] };
  return json.elements ?? [];
}

function sameHost(website: string, email: string) {
  try {
    const host = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace(/^www\./, "");
    const mailHost = email.split("@")[1]?.toLowerCase() ?? "";
    return mailHost === host || mailHost.endsWith(`.${host}`);
  } catch {
    return false;
  }
}

async function publishedMailto(website?: string | null) {
  if (!website) return null;
  const href = website.startsWith("http") ? website : `https://${website}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(href, {
      headers: { "User-Agent": UA },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const html = (await response.text()).slice(0, 400_000);
    const match = html.match(/mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
    const email = match?.[1]?.toLowerCase() ?? null;
    if (!email || isPersonalMailbox(email) || !sameHost(href, email)) return null;
    return email;
  } catch {
    return null;
  }
}

export async function discoverForCampaign(db: Db, campaignId: string) {
  const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { found: 0 };

  let lat = campaign.lat;
  let lng = campaign.lng;
  if (lat == null || lng == null) {
    const geo = await geocodeCity(campaign.city);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      await db.campaign.update({
        where: { id: campaign.id },
        data: { lat, lng },
      });
    }
  }
  if (lat == null || lng == null) return { found: 0 };

  const elements = await overpass(lat, lng, Math.round(campaign.radiusKm * 1000));
  let found = 0;

  for (const element of elements) {
    const tags = element.tags ?? {};
    const name = tags.name?.trim();
    if (!name) continue;
    const osmId = `${element.type}/${element.id}`;
    const website = tags.website ?? tags["contact:website"] ?? null;
    const osmEmail = (tags.email ?? tags["contact:email"] ?? "").toLowerCase() || null;
    const email =
      osmEmail && !isPersonalMailbox(osmEmail)
        ? osmEmail
        : await publishedMailto(website);

    try {
      await db.campaignLead.upsert({
        where: { campaignId_osmId: { campaignId: campaign.id, osmId } },
        update: {
          website: website ?? undefined,
          email: email ?? undefined,
          phone: tags.phone ?? tags["contact:phone"] ?? undefined,
        },
        create: {
          campaignId: campaign.id,
          name,
          category: tags.shop ?? tags.office ?? tags.craft ?? null,
          website,
          email,
          phone: tags.phone ?? tags["contact:phone"] ?? null,
          address: [tags["addr:street"], tags["addr:city"] ?? campaign.city].filter(Boolean).join(", "),
          osmId,
          source: email ? (osmEmail ? "OSM_EMAIL" : "WEBSITE_MAILTO") : "OSM",
          consentSource: email ? "public-listing" : null,
          lat: element.lat ?? element.center?.lat,
          lng: element.lon ?? element.center?.lon,
          interest: LeadInterest.UNKNOWN,
        },
      });
      found += 1;
    } catch {
      // unique miss when osmId is null on older rows
    }
  }

  return { found };
}
