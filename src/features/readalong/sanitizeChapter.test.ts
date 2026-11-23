import { describe, expect, it } from 'vitest';
import { isOrnament, resolveChapterPath, sanitizeChapter } from './sanitizeChapter';

const img = (p: string) => `https://jf/proxy/${p}?ApiKey=t`;

describe('resolveChapterPath', () => {
  it('resolves ../ and ./ against the chapter directory', () => {
    expect(resolveChapterPath('OEBPS/text/ch1.xhtml', '../images/a.jpg')).toBe(
      'OEBPS/images/a.jpg',
    );
    expect(resolveChapterPath('OEBPS/text/ch1.xhtml', './b.png')).toBe('OEBPS/text/b.png');
    expect(resolveChapterPath('ch1.xhtml', 'img/c.png')).toBe('img/c.png');
  });
});

describe('sanitizeChapter', () => {
  it('removes scripts, styles, embeds and event handlers but keeps ids and text', () => {
    const html = `<html><body>
      <script>window.__xss = 1</script>
      <style>p{color:red}</style>
      <iframe src="https://evil"></iframe>
      <p id="s1" onclick="alert(1)">Hello <em id="w1">world</em>.</p>
      <a href="javascript:alert(1)" id="s2">link</a>
    </body></html>`;
    const out = sanitizeChapter(html, 'text/ch1.xhtml', img);
    expect(out).not.toContain('<script');
    expect(out).not.toContain('<style');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('id="s1"');
    expect(out).toContain('id="w1"');
    expect(out).toContain('id="s2"');
    expect(out).toContain('Hello <em id="w1">world</em>.');
  });

  it('rewrites relative image sources through the proxy and lazy-loads them', () => {
    const out = sanitizeChapter(
      '<p id="s1"><img src="../images/cover.jpg" alt="c"/></p>',
      'OEBPS/text/ch1.xhtml',
      img,
    );
    expect(out).toContain('src="https://jf/proxy/OEBPS/images/cover.jpg?ApiKey=t"');
    expect(out).toContain('loading="lazy"');
  });

  it('leaves absolute image sources alone and drops data: URLs', () => {
    const out = sanitizeChapter(
      '<img src="https://cdn/x.png"/><img src="data:image/png;base64,AAAA"/>',
      'ch.xhtml',
      img,
    );
    expect(out).toContain('src="https://cdn/x.png"');
    expect(out).not.toContain('data:image');
  });

  it('strips in-book anchors so a tap never navigates the app away', () => {
    const out = sanitizeChapter('<a href="ch2.xhtml#s9" id="s3">next</a>', 'ch.xhtml', img);
    expect(out).toBe('<a id="s3">next</a>');
  });

  it('parses the chapter as XML so a self-closing page anchor does not swallow the text after it', () => {
    const xhtml =
      '<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body>' +
      '<p><a id="page_10"/><span id="s0">One.</span> <span class="small" id="s1">TWO.</span></p>' +
      '</body></html>';
    const out = sanitizeChapter(xhtml, 'OEBPS/Text/ch.xhtml', (p) => p);
    const doc = new DOMParser().parseFromString(`<div>${out}</div>`, 'text/html');
    expect(doc.querySelector('a')).toBeNull();
    expect(doc.getElementById('s0')?.closest('a')).toBeNull();
    expect(doc.getElementById('s0')?.textContent).toBe('One.');
    expect(doc.getElementById('s1')?.getAttribute('class')).toBe('small');
  });

  it('falls back to the HTML parser when the chapter is not well-formed XML', () => {
    const out = sanitizeChapter('<p id="s0">Unclosed <b>bold</p>', 'ch.xhtml', (p) => p);
    expect(out).toContain('id="s0"');
    expect(out).toContain('bold');
  });
});

describe('scene-break ornaments', () => {
  const img = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.querySelector('img') as Element;
  };

  it.each([
    ['<img src="../images/orn.jpg">', true],
    ['<img class="star" src="a.png">', true],
    ['<img alt="section break" src="a.png">', true],
    ['<p class="section-break"><img src="a.png"></p>', true],
    ['<p class="center"><img src="images/map.png"></p>', false],
    ['<img alt="" class="w100" src="../image/SecOrn.jpg">', true],
    ['<img width="40" height="40" src="a.png">', true],
    ['<img width="600" height="400" src="map.jpg">', false],
    ['<img src="images/cover.jpg">', false],
  ])('%s → ornament %s', (html, expected) => {
    expect(isOrnament(img(html))).toBe(expected);
  });

  it('tags ornaments in a sanitized chapter and leaves illustrations alone', () => {
    const out = sanitizeChapter(
      '<html xmlns="http://www.w3.org/1999/xhtml"><body><p class="center"><img src="../image/SecOrn.jpg"/></p><p><img src="../images/map.jpg" width="600"/></p></body></html>',
      'OEBPS/xhtml/ch1.xhtml',
      (p) => `/proxy/${p}`,
    );
    const doc = new DOMParser().parseFromString(out, 'text/html');
    const [orn, map] = Array.from(doc.querySelectorAll('img'));
    expect(orn.classList.contains('readalong__ornament')).toBe(true);
    expect(map.classList.contains('readalong__ornament')).toBe(false);
  });
});
