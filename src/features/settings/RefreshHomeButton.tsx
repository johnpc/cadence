import { useState } from 'react';
import { homeShelvesEnabled } from '../../lib/runtimeConfig';
import { refreshHomeShelves } from './refreshHome';
import { useToast } from '../toast/useToast';

/** Settings action: force the plugin to regenerate this user's Home
 * recommendations fresh (drops the server-side cache + rebuilds). Only shown
 * when the CadenceConfig plugin serves the fast-path shelves — otherwise Home
 * already uses live native queries and there's nothing to invalidate. */
export function RefreshHomeButton() {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  if (!homeShelvesEnabled()) return null;

  const run = async () => {
    setBusy(true);
    try {
      await refreshHomeShelves();
      toast('Home recommendations refreshed');
    } catch {
      toast('Could not refresh right now');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="settings__clear-cache"
      data-testid="settings-refresh-home"
      disabled={busy}
      onClick={() => void run()}
    >
      {busy ? 'Refreshing…' : 'Refresh Home recommendations'}
    </button>
  );
}
