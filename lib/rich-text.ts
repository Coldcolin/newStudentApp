import DOMPurify from "isomorphic-dompurify";

export type RichTextFormat = "text" | "html";

// Mirrors the allowlist in the backend's utils/sanitizeTaskDescription.js.
// Descriptions are sanitized on write, but we sanitize again on render so a row
// that predates the backend change (or was written by another client) is still safe.
export const RICH_TEXT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "a",
];

export const RICH_TEXT_ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR,
  });
}

// Regex-based rather than DOM-based so it is safe to call during server rendering.
function stripTags(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre|tr)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Plain-text form of a description — for search matching and single-line clamps,
 * where rendered markup would either pollute the match or refuse to clamp.
 */
export function richTextToPlain(
  content: string | null | undefined,
  format: RichTextFormat = "text",
): string {
  if (!content) return "";
  return format === "html" ? stripTags(content) : content;
}

/** The editor emits "<p></p>" for an empty document, which is truthy. */
export function isRichTextEmpty(html: string | null | undefined): boolean {
  return richTextToPlain(html, "html").length === 0;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Loads a legacy plain-text description into the editor as paragraphs, so editing an
 * old task upgrades it to rich text instead of showing its punctuation as markup.
 */
export function plainTextToHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .split(/\r?\n/)
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<p></p>"))
    .join("");
}

/** Editor output is always HTML, but an untouched legacy value should stay "text". */
export function toEditorHtml(
  content: string | null | undefined,
  format: RichTextFormat | undefined,
): string {
  return format === "html" ? (content ?? "") : plainTextToHtml(content);
}
