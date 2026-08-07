/** How many characters of a book's description to show before "Show more". */
const PREVIEW_LIMIT = 280;

/** The collapsed preview of a description: the full text when it's already short,
 * else a trimmed slice cut at the last word boundary within the limit, with an
 * ellipsis. Pure so it's unit-testable. */
export function aboutPreview(text: string, limit = PREVIEW_LIMIT): string {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

/** True when the description is long enough that a collapsed preview differs from
 * the full text (so the Show more / Show less toggle is worth rendering). */
export function isAboutTruncatable(text: string, limit = PREVIEW_LIMIT): boolean {
  return text.length > limit;
}
