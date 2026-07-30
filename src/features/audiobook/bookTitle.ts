import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Drop a trailing "(Unabridged)"/"(Abridged)" qualifier. */
function stripQualifier(s: string): string {
  return s.replace(/\s*\((un)?abridged\)\s*$/i, '').trim();
}

/** Strip a LEADING track-number prefix ("01 ", "1 - ", "01. ") — but only when
 * real title text follows, so a legitimately-numeric title ("1984", "451") is
 * left intact. Album folders are often track-numbered ("01 Blade Runner"). */
function stripLeadingTrackNo(s: string): string {
  const stripped = s.replace(/^\s*\d+\s*[-._]?\s+/, '').trim();
  return /[A-Za-z]/.test(stripped) ? stripped : s;
}

/**
 * The display title for a grouped book. The `Album` tag is usually the canonical
 * book name (parts are named per-chapter, e.g. "1 - Heir of Fire: Opening
 * Credits" while the Album is "Heir of Fire"), so prefer it — but the Album can
 * itself carry a track-number prefix ("01 Blade Runner") while the Name is clean
 * ("Blade Runner"), so clean both and fall back to the Name when the Album is
 * empty or just a bare number. For a multi-part set with no Album (e.g. "Home
 * Front-Part01".."Part12") the Name still has a part suffix, so strip that.
 */
export function bookTitle(rep: JellyfinItem, partCount: number): string {
  let name = stripLeadingTrackNo(stripQualifier(rep.Name));
  if (!rep.Album && partCount > 1) {
    name = name.replace(/[-_]?\s*(part|chapter|disc|cd|track)?\s*\d+.*$/i, '').trim() || name;
  }
  if (rep.Album) {
    const album = stripLeadingTrackNo(stripQualifier(rep.Album));
    // Prefer the Album unless it cleaned to nothing, or to a bare number while
    // the Name has real text (Album "451" vs Name "Fahrenheit 451").
    if (album && !(/^\d+$/.test(album) && /[A-Za-z]/.test(name))) return album;
  }
  return name || rep.Name;
}
