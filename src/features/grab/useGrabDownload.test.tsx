import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./grabClient', () => ({ grabDownload: vi.fn() }));
vi.mock('./pollJob', () => ({ pollJob: vi.fn() }));
const toast = vi.fn();
vi.mock('../toast/useToast', () => ({ useToast: () => toast }));

import { grabDownload } from './grabClient';
import { pollJob } from './pollJob';
import { useGrabDownload } from './useGrabDownload';
import type { GrabResult } from './grabTypes';

const result = { video_id: 'v1', title: 'Creep' } as GrabResult;

afterEach(() => {
  vi.resetAllMocks();
});

describe('useGrabDownload', () => {
  it('toasts success when the job completes', async () => {
    vi.mocked(grabDownload).mockResolvedValue({ job_id: 'j1', status: 'queued' });
    vi.mocked(pollJob).mockResolvedValue({ job_id: 'j1', status: 'completed' });
    const { result: h } = renderHook(() => useGrabDownload());
    await act(() => h.current.grab(result, 'tok'));
    expect(grabDownload).toHaveBeenCalledWith(result, 'tok');
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Grabbed/));
    expect(h.current.busyId).toBeNull();
  });

  it('toasts failure when the job fails', async () => {
    vi.mocked(grabDownload).mockResolvedValue({ job_id: 'j1', status: 'queued' });
    vi.mocked(pollJob).mockResolvedValue({ job_id: 'j1', status: 'failed' });
    const { result: h } = renderHook(() => useGrabDownload());
    await act(() => h.current.grab(result, 'tok'));
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Couldn.t grab/));
  });

  it('toasts an error when the download call throws', async () => {
    vi.mocked(grabDownload).mockRejectedValue(new Error('net'));
    const { result: h } = renderHook(() => useGrabDownload());
    await act(() => h.current.grab(result, 'tok'));
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Couldn.t start/));
  });
});
