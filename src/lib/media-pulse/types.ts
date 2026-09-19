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
  viewers?: number;
};

export type PulseFrontpage = {
  stories: PulseStory[];
  kinds: MediaPulseKindName[];
};
