import { generateText } from "ai";

import { fallbackSocialCaption } from "~/lib/social/caption";

export async function craftSocialCaption(input: {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  permalink?: string | null;
}) {
  const fallback = fallbackSocialCaption(input);
  try {
    const { text } = await generateText({
      model: "openai/gpt-5",
      temperature: 0.5,
      system:
        "You turn a long personal blog into a short Instagram caption. Keep the author's voice. Two to four short lines. No hype. No invented facts. Optional three quiet hashtags on the last line. If a permalink is given, put it on its own final line.",
      prompt: [
        `Title: ${input.title}`,
        input.excerpt ? `Excerpt: ${input.excerpt}` : "",
        input.content ? `Story: ${input.content.slice(0, 1800)}` : "",
        input.permalink ? `Permalink: ${input.permalink}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    const caption = text?.trim().replace(/^["']|["']$/g, "");
    return caption && caption.length > 8 ? caption.slice(0, 2200) : fallback;
  } catch {
    return fallback;
  }
}
