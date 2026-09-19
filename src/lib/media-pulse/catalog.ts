import type { MediaPulseKindName } from "./kinds";

export type WireSeed = {
  topic: string;
  query: string;
  kind: MediaPulseKindName;
  take?: number;
  youtube?: string;
};

export const WIRE_DESK: WireSeed[] = [
  { topic: "maphorisa", query: "DJ Maphorisa", kind: "VIDEO", take: 2, youtube: "https://www.youtube.com/watch?v=oaYJbNkIrNk" },
  { topic: "madlanga", query: "Madlanga Commission", kind: "ARTICLE", take: 3 },
  { topic: "amapiano", query: "Amapiano", kind: "VIDEO" },
  { topic: "tyla", query: "Tyla", kind: "VIDEO", youtube: "https://www.youtube.com/watch?v=XoiOOiuH8iI" },
  { topic: "kabza", query: "Kabza De Small", kind: "VIDEO" },
  { topic: "waffles", query: "Uncle Waffles", kind: "VIDEO" },
  { topic: "kelvin-momo", query: "Kelvin Momo", kind: "VIDEO" },
  { topic: "gqom", query: "Gqom", kind: "VIDEO" },
  { topic: "johannesburg", query: "Johannesburg news", kind: "ARTICLE" },
  { topic: "soweto", query: "Soweto", kind: "ARTICLE" },
  { topic: "parliament", query: "South Africa parliament", kind: "ARTICLE", take: 2 },
  { topic: "mzansi", query: "Mzansi news today", kind: "ARTICLE" },
  { topic: "sa-music", query: "South African music", kind: "VIDEO" },
  { topic: "african-builders", query: "African startup creators", kind: "ARTICLE" },
  { topic: "paystack", query: "Paystack Africa", kind: "ARTICLE" },
];

/** @deprecated Use WIRE_DESK + live fetch. Kept for older imports. */
export const EDITORIAL_WIRE = WIRE_DESK.map((item) => ({
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
