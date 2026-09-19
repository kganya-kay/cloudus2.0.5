const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "your",
  "our",
  "into",
  "about",
  "after",
  "before",
  "just",
  "have",
  "been",
  "will",
  "they",
  "them",
  "their",
  "what",
  "when",
  "where",
  "cloudus",
]);

export type TopicSeed = {
  topic: string;
  label: string;
  userId?: string | null;
  source: string;
};

export function slugTopic(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function titleFromSlug(topic: string) {
  return topic
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function extractTopics(text: string, userId?: string | null, source = "TEXT"): TopicSeed[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP.has(word));

  const unique = [...new Set(words)].slice(0, 6);
  return unique.map((word) => ({
    topic: slugTopic(word),
    label: titleFromSlug(slugTopic(word)),
    userId: userId ?? undefined,
    source,
  }));
}

export function rankTopics(seeds: TopicSeed[]) {
  const byTopic = new Map<
    string,
    { topic: string; label: string; users: Set<string>; mentions: number; sources: Set<string> }
  >();

  for (const seed of seeds) {
    if (!seed.topic) continue;
    const current = byTopic.get(seed.topic) ?? {
      topic: seed.topic,
      label: seed.label,
      users: new Set<string>(),
      mentions: 0,
      sources: new Set<string>(),
    };
    current.mentions += 1;
    current.sources.add(seed.source);
    if (seed.userId) current.users.add(seed.userId);
    if (seed.label.length > current.label.length) current.label = seed.label;
    byTopic.set(seed.topic, current);
  }

  return [...byTopic.values()]
    .map((item) => ({
      topic: item.topic,
      label: item.label,
      uniqueUsers: item.users.size,
      mentions: item.mentions,
      sources: [...item.sources],
      shared: item.users.size >= 2,
    }))
    .sort((a, b) => {
      if (b.uniqueUsers !== a.uniqueUsers) return b.uniqueUsers - a.uniqueUsers;
      if (b.mentions !== a.mentions) return b.mentions - a.mentions;
      return a.topic.localeCompare(b.topic);
    });
}

export function scoreStory(input: {
  uniqueUsers: number;
  mentions: number;
  hasVideo: boolean;
  hasAudio: boolean;
  hasImage: boolean;
  shared: boolean;
  freshnessHours: number;
}) {
  const media = input.hasVideo ? 24 : input.hasAudio ? 16 : input.hasImage ? 10 : 0;
  const social = input.uniqueUsers * 12 + (input.shared ? 20 : 0);
  const volume = Math.min(input.mentions, 8) * 2;
  const freshness = Math.max(0, 12 - input.freshnessHours);
  return social + media + volume + freshness;
}
