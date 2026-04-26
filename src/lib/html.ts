import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "code",
];

const ALLOWED_ATTR = ["href", "target", "rel", "dir", "style"];

export function sanitizeProductHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:)/i,
  });
}

export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return cleaned.replace(/\s+/g, " ").trim();
}

export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/**
 * Escape a string for safe interpolation into HTML text or attribute contexts.
 * Use this for any user-controlled value that flows into a template literal
 * that builds HTML (e.g. transactional emails). Quotes are escaped so the
 * same helper is safe in `<a href="...">` and `<a href='...'>` contexts.
 */
export function escapeHtml(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  const s = String(input);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
