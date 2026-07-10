import { afterEach, describe, expect, it, vi } from 'vitest';

const { writeFile, getUri, deleteFile } = vi.hoisted(() => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  getUri: vi.fn(),
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile, getUri, deleteFile },
  Directory: { Data: 'DATA' },
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: { convertFileSrc: (uri: string) => `capacitor://localhost/_capacitor_file_${uri}` },
}));
vi.mock('./base64', () => ({ blobToBase64: vi.fn().mockResolvedValue('QUJD') }));

import { filesystemBlobStore } from './filesystemBlobStore';

describe('filesystemBlobStore', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('writes base64 to the Data dir under downloads/<id>.audio (recursive)', async () => {
    await filesystemBlobStore.putBlob('track1', new Blob(['x']));
    expect(writeFile).toHaveBeenCalledWith({
      path: 'downloads/track1.audio',
      data: 'QUJD',
      directory: 'DATA',
      recursive: true,
    });
  });

  it('returns a WKWebView-playable src via convertFileSrc', async () => {
    getUri.mockResolvedValueOnce({ uri: 'file:///data/downloads/track1.audio' });
    const url = await filesystemBlobStore.blobUrl('track1');
    expect(url).toBe('capacitor://localhost/_capacitor_file_file:///data/downloads/track1.audio');
  });

  it('returns null when the file is missing (getUri throws)', async () => {
    getUri.mockRejectedValueOnce(new Error('not found'));
    expect(await filesystemBlobStore.blobUrl('nope')).toBeNull();
  });

  it('deletes the file, swallowing a missing-file error', async () => {
    await filesystemBlobStore.removeBlob('track1');
    expect(deleteFile).toHaveBeenCalledWith({ path: 'downloads/track1.audio', directory: 'DATA' });
    deleteFile.mockRejectedValueOnce(new Error('gone'));
    await expect(filesystemBlobStore.removeBlob('track1')).resolves.toBeUndefined();
  });
});
