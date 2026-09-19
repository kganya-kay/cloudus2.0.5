import type { MediaPulseKindName } from "./kinds";

export type PulseStory = {
  id: string;
  topic: string;
  kind: MediaPulseKindName;
  title: string;
  dek: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  videoUrl: string | null;
  audioUrl: string | null;
  embedHtml: string | null;
  interestCount: number;
  score: number;
  shared: boolean;
};

export type PulseFrontpage = {
  lead: PulseStory;
  rail: PulseStory[];
  kinds: MediaPulseKindName[];
};
