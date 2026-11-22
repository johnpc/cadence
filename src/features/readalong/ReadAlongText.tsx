import { useEffect, useLayoutEffect, useRef } from 'react';
import { followScroll, type FollowReason } from './followScroll';
import type { FollowMode } from './readAlongState';

/**
 * The chapter body with the narrated sentence highlighted. Owns one container
 * whose innerHTML is the SANITIZED chapter (see sanitizeChapter), written
 * imperatively ONLY when the chapter html changes — never via
 * dangerouslySetInnerHTML, which React may re-apply on an ordinary re-render
 * (every progress tick), wiping the highlight. The highlight is moved
 * imperatively too: re-rendering thousands of sentences through React on every
 * tick would be the wrong tool. Keeping the sentence in view is one decision
 * per change (followScroll): an instant jump on open / new chapter, a gentle
 * catch-up only once it drifts out of the reading band, nothing otherwise. The
 * container's own scrolls never count as the reader taking over — only wheel,
 * touch and keys do (onReaderScroll). A tap on any element with an id reports
 * that id (the sentence anchor).
 */
export function ReadAlongText({
  html,
  activeFragment,
  upcomingFragment,
  follow,
  onTapFragment,
  onReaderScroll,
}: {
  html: string;
  activeFragment: string | null;
  /** During a silent stretch: the sentence about to be narrated (no active one). */
  upcomingFragment: string | null;
  follow: FollowMode;
  onTapFragment: (fragment: string) => void;
  onReaderScroll: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Why the next scroll happens: a fresh mount is an open, new html a chapter.
  const reason = useRef<FollowReason>('open');

  // Replace the chapter markup only when the chapter itself changes. A layout
  // effect, so the highlight effect below always sees the new nodes.
  useLayoutEffect(() => {
    if (ref.current) ref.current.innerHTML = html;
    if (reason.current !== 'open') reason.current = 'chapter';
  }, [html]);

  // Move the highlight whenever the active sentence (or the chapter html) changes.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    for (const el of Array.from(root.querySelectorAll('[data-active], [data-upcoming]'))) {
      el.removeAttribute('data-active');
      el.removeAttribute('data-upcoming');
      el.classList.remove('readalong__active', 'readalong__upcoming');
    }
    const fragment = activeFragment ?? upcomingFragment;
    if (!fragment) return;
    const el = root.querySelector<HTMLElement>(`[id="${cssEscape(fragment)}"]`);
    if (!el) return;
    const mark = activeFragment ? 'active' : 'upcoming';
    el.setAttribute(`data-${mark}`, 'true');
    el.classList.add(`readalong__${mark}`);
    if (follow === 'following') keepInView(root, el, reason.current);
    reason.current = 'tick';
  }, [html, activeFragment, upcomingFragment, follow]);

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

/** Measure the sentence against the scroller and apply followScroll's verdict. */
function keepInView(root: HTMLDivElement, el: HTMLElement, reason: FollowReason): void {
  if (typeof root.scrollTo !== 'function') return;
  const view = root.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const decision = followScroll({
    activeTop: rect.top - view.top + root.scrollTop,
    activeBottom: rect.bottom - view.top + root.scrollTop,
    viewTop: root.scrollTop,
    viewHeight: root.clientHeight,
    reason,
  });
  if (decision.kind === 'none') return;
  root.scrollTo({ top: decision.to, behavior: decision.kind === 'jump' ? 'auto' : 'smooth' });
}

/** Escape an id for use inside an attribute selector (ids may carry dots/colons). */
function cssEscape(id: string): string {
  return id.replace(/["\\]/g, '\\$&');
}
