import type { MediaPulseKindName } from "./kinds";

export type DeskBeat = {
  topic: string;
  query: string;
  kind: MediaPulseKindName;
  take?: number;
  youtube?: string;
  channelId?: string;
  handle?: string;
  rss?: string;
  match?: string;
  skipShorts?: boolean;
};

export const DESK_CHANNELS: Record<string, string> = {
  "@thediaryofaceo": "UCGq-a57w-aPwyi3pW7XLiHw",
  "@encanews": "UCI3RT5PGmdi1KVp9FG_CneA",
  "@mightijamietv": "UCUe-mj19X5AfmEXhnC-Ipdg",
  "@mightijamie": "UCUe-mj19X5AfmEXhnC-Ipdg",
};

export const DAILY_DESK: DeskBeat[] = [
  {
    topic: "doac",
    query: "Diary of a CEO latest episode",
    kind: "VIDEO",
    channelId: "UCGq-a57w-aPwyi3pW7XLiHw",
    handle: "@TheDiaryOfACEO",
    skipShorts: true,
    take: 1,
  },
  {
    topic: "enca",
    query: "eNCA",
    kind: "VIDEO",
    channelId: "UCI3RT5PGmdi1KVp9FG_CneA",
    handle: "@encanews",
    take: 2,
  },
  {
    topic: "enca-wire",
    query: "site:enca.com",
    kind: "ARTICLE",
    take: 2,
  },
  {
    topic: "mighti-jamie",
    query: "Mighti Jamie Madlanga",
    kind: "VIDEO",
    channelId: "UCUe-mj19X5AfmEXhnC-Ipdg",
    handle: "@MightiJamieTV",
    match: "Madlanga|Commission|SAPS|Mkhwanazi|Matlala|Sibiya|Masemola|cartel|witness|bail",
    take: 2,
  },
  { topic: "madlanga", query: "Madlanga Commission", kind: "ARTICLE", take: 2 },
  { topic: "maphorisa", query: "DJ Maphorisa", kind: "VIDEO", take: 1 },
  { topic: "amapiano", query: "Amapiano", kind: "VIDEO" },
  { topic: "tyla", query: "Tyla", kind: "VIDEO" },
  { topic: "kabza", query: "Kabza De Small", kind: "VIDEO" },
  { topic: "parliament", query: "South Africa parliament", kind: "ARTICLE", take: 2 },
  { topic: "johannesburg", query: "Johannesburg news", kind: "ARTICLE" },
  { topic: "mzansi", query: "Mzansi news today", kind: "ARTICLE" },
];

/** @deprecated Use DAILY_DESK. */
export const WIRE_DESK = DAILY_DESK;

/** @deprecated Use DAILY_DESK + live fetch. */
export const EDITORIAL_WIRE = DAILY_DESK.map((item) => ({
  topic: item.topic,
  label: item.query,
  kind: item.kind,
  title: item.query,
  dek: item.query,
  sourceName: item.kind === "VIDEO" ? "YouTube" : "News",
  sourceUrl: item.youtube ?? `https://news.google.com/search?q=${encodeURIComponent(item.query)}`,
  imageUrl: "",
  videoUrl: item.youtube,
}));
