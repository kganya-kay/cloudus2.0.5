export function fallbackSocialCaption(input: {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  permalink?: string | null;
}) {
  const title = input.title.trim();
  const excerpt = input.excerpt?.trim() ?? "";
  const firstLine =
    input.content
      ?.trim()
      .split(/\n+/)
      .map((line) => line.trim())
      .find(Boolean) ?? "";
  const body = (excerpt || firstLine).slice(0, 180);
  return [title, body, input.permalink?.trim()]
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
}
