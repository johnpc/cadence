import { describe, expect, it } from 'vitest';
import { resolveChapterPath, sanitizeChapter } from './sanitizeChapter';

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
});
