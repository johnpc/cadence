/**
 * Turn a Storyteller chapter (XHTML from the user's own server, proxied by the
 * plugin) into markup safe to inject into our page. Third-party HTML is never
 * trusted: scripts, styles, embeds and every event handler go; `javascript:`
 * URLs go; element ids STAY — they are the sentence anchors the highlighter and
 * tap-to-seek key on. Relative image sources are rewritten to the plugin's text
 * proxy (with the ApiKey query, since an <img> can't send a header).
 */

const DROP = new Set(['script', 'style', 'link', 'iframe', 'object', 'embed', 'meta', 'base']);

/** Resolve a resource path relative to the chapter's directory inside the book
 * ("OEBPS/text/ch1.xhtml" + "../images/a.jpg" → "OEBPS/images/a.jpg"). */
export function resolveChapterPath(chapterHref: string, relative: string): string {
  const dir = chapterHref.includes('/') ? chapterHref.slice(0, chapterHref.lastIndexOf('/')) : '';
  const parts = dir ? dir.split('/') : [];
  for (const seg of relative.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}

function isUnsafeUrl(value: string): boolean {
  return /^\s*(javascript|data|vbscript):/i.test(value);
}

function scrubAttributes(el: Element): void {
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on')) el.removeAttribute(attr.name);
    else if (
      (name === 'href' || name === 'src' || name === 'xlink:href') &&
      isUnsafeUrl(attr.value)
    )
      el.removeAttribute(attr.name);
  }
}

function isAbsoluteUrl(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('//');
}

/**
 * Sanitize one chapter. `imageUrl` maps a book-relative resource path to the
 * proxied URL an <img> can load. Returns the body's inner HTML — a string React
 * can set via dangerouslySetInnerHTML into a container we own.
 */
export function sanitizeChapter(
  xhtml: string,
  chapterHref: string,
  imageUrl: (path: string) => string,
): string {
  const body = parseChapterBody(xhtml);
  for (const el of Array.from(body.querySelectorAll('*'))) {
    if (DROP.has(el.localName)) {
      el.remove();
      continue;
    }
    if (el.localName === 'a' && !el.textContent?.trim() && el.children.length === 0) {
      // A bare page/position anchor (<a id="page_10"/>): nothing to show, and in the
      // HTML parser an unclosed one would swallow the paragraph after it.
      el.remove();
      continue;
    }
    scrubAttributes(el);
    if (el.localName === 'img') {
      const src = el.getAttribute('src');
      if (src && !isAbsoluteUrl(src)) {
        el.setAttribute('src', imageUrl(resolveChapterPath(chapterHref, src)));
      }
      el.setAttribute('loading', 'lazy');
    }
    if (el.localName === 'a') {
      // Book-internal links would navigate the SPA away; keep the text, drop the jump.
      el.removeAttribute('href');
    }
  }
  return body.innerHTML;
}

/**
 * Chapters are XHTML: parse them as XML first, which honours self-closing tags
 * (`<a id="page_10"/>` is a closed, empty anchor). The HTML parser treats that
 * same markup as an OPEN anchor and nests the rest of the chapter inside it —
 * seen live with Hogfather, where whole pages rendered as one link. Only when
 * the XML is malformed do we fall back to the forgiving HTML parser.
 */
function parseChapterBody(xhtml: string): Element {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xhtml, 'application/xhtml+xml');
  if (!xml.getElementsByTagName('parsererror').length) {
    const body = xml.getElementsByTagName('body')[0];
    if (body) return body;
  }
  return parser.parseFromString(xhtml, 'text/html').body;
}
