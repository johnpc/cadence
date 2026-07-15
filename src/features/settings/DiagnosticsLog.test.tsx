import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DiagnosticsLog } from './DiagnosticsLog';

describe('DiagnosticsLog', () => {
  it('shows the empty hint with no entries', () => {
    render(<DiagnosticsLog entries={[]} />);
    expect(screen.getByTestId('diagnostics-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('diagnostics-log')).not.toBeInTheDocument();
  });

  it('renders a formatted line per entry', () => {
    render(
      <DiagnosticsLog
        entries={[
          { ts: 0, category: 'play', message: 'a', fields: {} },
          { ts: 1000, category: 'pause', message: 'b', fields: { pos: '1.0' } },
        ]}
      />,
    );
    const log = screen.getByTestId('diagnostics-log');
    expect(log).toHaveTextContent('[play] a');
    expect(log).toHaveTextContent('[pause] b pos=1.0');
  });
});
