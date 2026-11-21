import { useCallback, useEffect, useState } from 'react';
import {
  getStorytellerLink,
  linkStoryteller,
  unlinkStoryteller,
} from '../readalong/storytellerApi';
import { linkErrorMessage, type StorytellerLinkState } from './storytellerLinkState';

/** Drives the Settings "Storyteller" card: loads the current link, connects
 * with a username/password (the plugin exchanges them for a token it keeps
 * server-side — the client never stores either), and disconnects. */
export function useStorytellerLink(enabled: boolean) {
  const [state, setState] = useState<StorytellerLinkState>({ kind: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    getStorytellerLink()
      .then((link) => {
        if (cancelled) return;
        setState(
          link.Linked && link.Username
            ? { kind: 'linked', username: link.Username }
            : { kind: 'unlinked' },
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ kind: 'error', message: linkErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const connect = useCallback(async (username: string, password: string) => {
    setState({ kind: 'connecting' });
    try {
      const link = await linkStoryteller(username.trim(), password);
      setState({ kind: 'linked', username: link.Username ?? username.trim() });
    } catch (error) {
      setState({ kind: 'error', message: linkErrorMessage(error) });
    }
  }, []);

  const disconnect = useCallback(async () => {
    setState({ kind: 'connecting' });
    try {
      await unlinkStoryteller();
      setState({ kind: 'unlinked' });
    } catch (error) {
      setState({ kind: 'error', message: linkErrorMessage(error) });
    }
  }, []);

  return { state, connect, disconnect };
}
