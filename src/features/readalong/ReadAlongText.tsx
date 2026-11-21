import { useEffect, useLayoutEffect, useRef } from 'react';
import type { FollowMode } from './readAlongState';

/**
 * The chapter body with the narrated sentence highlighted. Owns one container
 * whose innerHTML is the SANITIZED chapter (see sanitizeChapter), written
 * imperatively ONLY when the chapter html changes — never via
 * dangerouslySetInnerHTML, which React may re-apply on an ordinary re-render
 * (every progress tick), wiping the highlight. The highlight is moved
 * imperatively too: re-rendering thousands of sentences through React on every
 * tick would be the wrong tool. A tap on any element with an id reports
 * that id (the sentence anchor); wheel/touch/keyboard scrolling reports reader
 * intent so the sheet can leave `following` mode.
 */
export function ReadAlongText({
  html,
  activeFragment,
  follow,
  onTapFragment,
  onReaderScroll,
}: {
  html: string;
  activeFragment: string | null;
  follow: FollowMode;
  onTapFragment: (fragment: string) => void;
  onReaderScroll: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // Replace the chapter markup only when the chapter itself changes. A layout
  // effect, so the highlight effect below always sees the new nodes.
  useLayoutEffect(() => {
    if (ref.current) ref.current.innerHTML = html;
  }, [html]);

  // Move the highlight whenever the active sentence (or the chapter html) changes.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const el of Array.from(root.querySelectorAll('[data-active]'))) {
      el.removeAttribute('data-active');
      el.classList.remove('readalong__active');
    }
    if (!activeFragment) return;
    const el = root.querySelector<HTMLElement>(`[id="${cssEscape(activeFragment)}"]`);
    if (!el) return;
    el.setAttribute('data-active', 'true');
    el.classList.add('readalong__active');
    if (follow === 'following') el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [html, activeFragment, follow]);

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[id]');
    if (target && ref.current?.contains(target)) onTapFragment(target.id);
  };

  return (
    <div
      ref={ref}
      className="readalong__text"
      data-testid="readalong-text"
      onClick={onClick}
      onWheel={onReaderScroll}
      onTouchMove={onReaderScroll}
      onKeyDown={(e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' '].includes(e.key)) onReaderScroll();
      }}
    />
  );
}

/** Escape an id for use inside an attribute selector (ids may carry dots/colons). */
function cssEscape(id: string): string {
  return id.replace(/["\\]/g, '\\$&');
}
