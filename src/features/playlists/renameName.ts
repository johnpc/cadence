/** The name to commit from a rename prompt: the trimmed input, or null when it
 * is empty or unchanged (no-op). Pure so the rename button's decision logic is
 * unit-testable without driving IonAlert. */
export function nextPlaylistName(input: string | undefined, current: string): string | null {
  const name = (input ?? '').trim();
  if (!name || name === current) return null;
  return name;
}
