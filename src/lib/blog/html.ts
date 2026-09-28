const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "u",
  "b",
  "i",
  "h2",
  "h3",
  "blockquote",
  "ul",
  "ol",
  "li",
  "img",
  "span",
  "div",
  "a",
]);

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function isRichHtml(value: string | null | undefined) {
  return Boolean(value && /<\/?[a-z][\s\S]*>/i.test(value));
}

export function plainToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

export function toBookHtml(value: string | null | undefined) {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  return isRichHtml(raw) ? sanitizeHtml(raw) : plainToHtml(raw);
}

export function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h2|h3|li|blockquote|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptFromHtml(value: string | null | undefined, max = 160) {
  const text = stripHtml(value ?? "");
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function firstImageSrc(value: string | null | undefined) {
  const match = value?.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

function sanitizeAttribute(name: string, raw: string, tag: string) {
  const value = raw.trim();
  if (/^on/i.test(name) || name.includes(":") || /javascript:/i.test(value)) return "";
  if (tag === "img") {
    if (name === "src" && /^https?:\/\//i.test(value)) return `src="${escapeHtml(value)}"`;
    if (name === "alt") return `alt="${escapeHtml(value)}"`;
    if (name === "class") return `class="${escapeHtml(value.replace(/[^a-z0-9 _-]/gi, ""))}"`;
    if (name === "data-float" && /^(left|right)$/i.test(value)) return `data-float="${value.toLowerCase()}"`;
    if ((name === "width" || name === "height") && /^\d+%?$/.test(value)) return `${name}="${value}"`;
    return "";
  }
  if (tag === "a" && name === "href" && /^https?:\/\//i.test(value)) {
    return `href="${escapeHtml(value)}"`;
  }
  if (name === "class") return `class="${escapeHtml(value.replace(/[^a-z0-9 _-]/gi, ""))}"`;
  return "";
}

export function sanitizeHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (full, tagName: string, attrs: string) => {
      const tag = tagName.toLowerCase();
      const closing = full.startsWith("</");
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (closing) return `</${tag}>`;
      if (tag === "br") return "<br />";
      const cleaned = Array.from(attrs.matchAll(/([a-z0-9:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi))
        .map((match) => sanitizeAttribute(match[1]!.toLowerCase(), match[3] ?? match[4] ?? match[5] ?? "", tag))
        .filter(Boolean)
        .join(" ");
      if (tag === "img") return cleaned.includes("src=") ? `<img ${cleaned} />` : "";
      return cleaned ? `<${tag} ${cleaned}>` : `<${tag}>`;
    });
}

const PAGE_CHARS = 920;

export function paginateHtml(html: string, maxChars = PAGE_CHARS) {
  const safe = sanitizeHtml(html);
  if (!safe) return [""];

  const chunks = safe
    .split(/(?=<p\b)|(?=<h2\b)|(?=<h3\b)|(?=<blockquote\b)|(?=<ul\b)|(?=<ol\b)|(?=<img\b)/i)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) return [safe];

  const pages: string[] = [];
  let current = "";

  for (const chunk of chunks) {
    const next = `${current}${chunk}`;
    if (current && stripHtml(next).length > maxChars) {
      pages.push(current);
      current = chunk;
    } else {
      current = next;
    }
  }

  if (current) pages.push(current);
  return pages.length > 0 ? pages : [safe];
}
