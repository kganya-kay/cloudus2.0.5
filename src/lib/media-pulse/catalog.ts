import type { MediaPulseKindName } from "./kinds";

export type EditorialWireItem = {
  topic: string;
  label: string;
  kind: MediaPulseKindName;
  title: string;
  dek: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  videoUrl?: string;
  audioUrl?: string;
  wikiTitle?: string;
  itunesTerm?: string;
};

const POSTER = "/cloudus-logo-final.png";

export const EDITORIAL_WIRE: EditorialWireItem[] = [
  {
    topic: "amapiano",
    label: "Amapiano",
    kind: "ARTICLE",
    title: "Amapiano",
    dek: "Pretoria piano.",
    sourceName: "Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/Amapiano",
    imageUrl: POSTER,
    wikiTitle: "Amapiano",
    itunesTerm: "amapiano",
  },
  {
    topic: "maphorisa",
    label: "DJ Maphorisa",
    kind: "PERSON",
    title: "DJ Maphorisa",
    dek: "Soweto Baby.",
    sourceName: "YouTube",
    sourceUrl: "https://www.youtube.com/watch?v=oaYJbNkIrNk",
    imageUrl: POSTER,
    videoUrl: "https://www.youtube.com/watch?v=oaYJbNkIrNk",
    wikiTitle: "DJ Maphorisa",
    itunesTerm: "DJ Maphorisa",
  },
  {
    topic: "johannesburg",
    label: "Johannesburg",
    kind: "PHOTO",
    title: "Johannesburg",
    dek: "The brief.",
    sourceName: "Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/Johannesburg",
    imageUrl: POSTER,
    wikiTitle: "Johannesburg",
  },
  {
    topic: "fl-studio",
    label: "FL Studio",
    kind: "CLIP",
    title: "FL Studio",
    dek: "The desk.",
    sourceName: "Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/FL_Studio",
    imageUrl: POSTER,
    wikiTitle: "FL Studio",
    itunesTerm: "amapiano instrumental",
  },
  {
    topic: "tyla",
    label: "Tyla",
    kind: "SONG",
    title: "Tyla",
    dek: "Water.",
    sourceName: "YouTube",
    sourceUrl: "https://www.youtube.com/watch?v=XoiOOiuH8iI",
    imageUrl: POSTER,
    videoUrl: "https://www.youtube.com/watch?v=XoiOOiuH8iI",
    wikiTitle: "Tyla (singer)",
    itunesTerm: "Tyla Water",
  },
  {
    topic: "soweto",
    label: "Soweto",
    kind: "EVENT",
    title: "Soweto",
    dek: "Stage.",
    sourceName: "Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/Soweto",
    imageUrl: POSTER,
    wikiTitle: "Soweto",
  },
  {
    topic: "paystack",
    label: "Paystack",
    kind: "ARTICLE",
    title: "Paystack",
    dek: "Paid.",
    sourceName: "Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/Paystack",
    imageUrl: POSTER,
    wikiTitle: "Paystack",
  },
  {
    topic: "hackathon",
    label: "Build Night",
    kind: "EVENT",
    title: "Build Night",
    dek: "Ship.",
    sourceName: "Wikipedia",
    sourceUrl: "https://en.wikipedia.org/wiki/Hackathon",
    imageUrl: POSTER,
    wikiTitle: "Hackathon",
  },
];

export function editorialAsStories() {
  return EDITORIAL_WIRE.map((item, index) => ({
    id: `editorial-${item.topic}`,
    topic: item.topic,
    kind: item.kind,
    title: item.title,
    dek: item.dek,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    imageUrl: item.imageUrl,
    videoUrl: item.videoUrl ?? null,
    audioUrl: item.audioUrl ?? null,
    embedHtml: null as string | null,
    interestCount: Math.max(2, 8 - index),
    score: 80 - index * 6,
    shared: index < 3,
  }));
}
