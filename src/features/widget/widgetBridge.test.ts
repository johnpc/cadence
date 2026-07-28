import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasWidgetBridge, pushWidgetSnapshot } from './widgetBridge';
import type { WidgetSnapshot } from './widgetTypes';

const snap: WidgetSnapshot = {
  id: 'b1',
  title: 'Dune',
  subtitle: 'Frank Herbert',
  kind: 'audiobook',
  artUrl: null,
  progress: 0.25,
  deepLink: 'cadence://open?path=%2Faudiobooks',
};

afterEach(() => {
  delete (window as unknown as { webkit?: unknown }).webkit;
});

function installBridge(post = vi.fn()) {
  (window as unknown as { webkit?: unknown }).webkit = {
    messageHandlers: { cadenceWidget: { postMessage: post } },
  };
  return post;
}

describe('widgetBridge', () => {
  it('reports no bridge on web', () => {
    expect(hasWidgetBridge()).toBe(false);
  });

  it('detects the native bridge when present', () => {
    installBridge();
    expect(hasWidgetBridge()).toBe(true);
  });

  it('posts the snapshot as JSON to native', () => {
    const post = installBridge();
    pushWidgetSnapshot(snap);
    expect(post).toHaveBeenCalledWith(JSON.stringify(snap));
  });

  it('posts "null" to clear the widget', () => {
    const post = installBridge();
    pushWidgetSnapshot(null);
    expect(post).toHaveBeenCalledWith('null');
  });

  it('is a no-op with no bridge', () => {
    expect(() => pushWidgetSnapshot(snap)).not.toThrow();
  });
});
