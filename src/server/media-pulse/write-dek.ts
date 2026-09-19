import { generateText } from "ai";

export async function writeStoryDek(input: {
  title: string;
  topic: string;
  sourceName: string;
  extract: string;
}) {
  const fallback = input.extract.trim().slice(0, 240) || `${input.title} is moving through the Cloudus room.`;
  try {
    const { text } = await generateText({
      model: "openai/gpt-5",
      temperature: 0.4,
      system:
        "You write newspaper standfirsts for Cloudus, a Creative OS for African builders. Two short sentences. Concrete. No hashtags. No marketing adjectives. No invented facts.",
      prompt: `Topic: ${input.topic}\nHeadline: ${input.title}\nSource: ${input.sourceName}\nFacts: ${input.extract.slice(0, 500)}`,
    });
    const dek = text?.trim().replace(/^["']|["']$/g, "");
    return dek && dek.length > 20 ? dek.slice(0, 320) : fallback;
  } catch {
    return fallback;
  }
}
