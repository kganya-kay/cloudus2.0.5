export type SocialMediaKindName = "IMAGE" | "VIDEO" | "AUDIO";

export type SocialDropValue = {
  url: string;
  kind: SocialMediaKindName;
  caption?: string | null;
  embedHtml?: string | null;
  source?: "SOCIAL" | "UPLOAD" | "URL";
};

export type SocialStoryMedia = {
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
};
