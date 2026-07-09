import { useCallback, useEffect, useState } from 'react';

const KEY = 'cadence.sidebar-collapsed';

/** Whether the desktop sidebar is collapsed to an icons-only rail, persisted
 * per-device. Toggling also flags <body> so the tab-page/mini-player inset CSS
 * can switch to the narrow width. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.body.classList.toggle('app-sidebar-collapsed', collapsed);
    try {
      localStorage.setItem(KEY, collapsed ? '1' : '0');
    } catch {
      /* storage unavailable — the in-memory state still applies this session */
    }
    return () => document.body.classList.remove('app-sidebar-collapsed');
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return { collapsed, toggle };
}
