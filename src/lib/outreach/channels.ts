export const OUTREACH_CHANNELS = ["LINKEDIN", "FACEBOOK", "INSTAGRAM"] as const;

export type SocialChannel = (typeof OUTREACH_CHANNELS)[number];

export const CHANNEL_SLOTS: Record<SocialChannel, { hourUtc: number; minute: number }> = {
  LINKEDIN: { hourUtc: 5, minute: 30 },
  FACEBOOK: { hourUtc: 9, minute: 0 },
  INSTAGRAM: { hourUtc: 16, minute: 0 },
};

export function slotFor(channel: SocialChannel, day = new Date()) {
  const slot = CHANNEL_SLOTS[channel];
  const at = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), slot.hourUtc, slot.minute, 0));
  return at;
}

export function composerUrl(channel: SocialChannel, permalink: string) {
  const encoded = encodeURIComponent(permalink);
  if (channel === "LINKEDIN") {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
  }
  if (channel === "FACEBOOK") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
  }
  return `https://www.instagram.com/accounts/login/?next=${encodeURIComponent("/create/style/")}`;
}

export function isPersonalMailbox(email: string) {
  const host = email.split("@")[1]?.toLowerCase() ?? "";
  return /^(gmail|googlemail|yahoo|hotmail|outlook|live|icloud|aol|proton)\./.test(`${host}.`);
}
