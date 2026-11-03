import { describe, expect, it } from 'vitest';
import { prettyStorageBytes, storageExplanation, summarizeStorage, workerExplanation } from './offlineReadiness';

describe('honest offline readiness labels', () => {
  it('reports approximate storage estimates only from valid numbers', () => {
    expect(prettyStorageBytes(undefined)).toBe('Unknown');
    expect(prettyStorageBytes(-1)).toBe('Unknown');
    expect(prettyStorageBytes(Number.NaN)).toBe('Unknown');
    expect(prettyStorageBytes(1024)).toBe('1.0 KiB');
    expect(prettyStorageBytes(1024 ** 3)).toBe('1.00 GiB');
    expect(summarizeStorage(1, 4).percentage).toBe(25);
    expect(summarizeStorage(10, 4).percentage).toBe(100);
    expect(summarizeStorage(0, 0).percentage).toBeNull();
    expect(summarizeStorage(undefined, undefined).percentage).toBeNull();
  });
  it('does not misrepresent worker activation or persistence as guarantees', () => {
    expect(workerExplanation('controlling')).toContain('may');
    expect(workerExplanation('registered')).toContain('not controlled');
    expect(workerExplanation('missing')).toContain('No active');
    expect(storageExplanation('persistent')).toContain('clearing site data');
    expect(storageExplanation('best-effort')).toContain('evict');
    expect(storageExplanation('unsupported')).toContain('did not expose');
  });
});
