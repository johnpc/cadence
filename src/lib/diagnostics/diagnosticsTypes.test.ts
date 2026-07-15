import { describe, expect, it } from 'vitest';
import { formatEntry } from './diagnosticsTypes';

describe('formatEntry', () => {
  it('renders time [category] message with sorted fields', () => {
    const line = formatEntry({
      ts: Date.UTC(2026, 0, 1, 12, 3, 4, 120),
      category: 'pause',
      message: 'unexpected',
      fields: { trackId: 'abc', pos: '12.0' },
    });
    expect(line).toBe('12:03:04.120 [pause] unexpected pos=12.0 trackId=abc');
  });

  it('omits the field suffix when there are no fields', () => {
    const line = formatEntry({ ts: 0, category: 'play', message: 'x', fields: {} });
    expect(line).toBe('00:00:00.000 [play] x');
  });
});
