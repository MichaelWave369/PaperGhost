import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { createBackupArchive, sha256, validateManifest } from './backup';
import type { Publication } from '../types';
import type { LearningProgress } from './trails';

async function fixture() {
  const source = new Blob(['Hello PaperGhost'], { type: 'text/plain' });
  const hash = await sha256(source);
  const metadata: Publication = {
    id: 'a0000000-b000-4000-8000-000000000001', title: 'Issue 000',
    fileName: 'Issue-000.txt', format: 'text', size: source.size, hash,
    importedAt: '2026-11-02T12:00:00Z', updatedAt: '2026-11-02T12:00:00Z',
    page: 1, skin: 'book'
  };
  return { source, metadata };
}

describe('GhostShelf portable backup', () => {
  it('creates a ZIP with original source bytes and a versioned manifest', async () => {
    const { source, metadata } = await fixture();
    const backup = await createBackupArchive([{ metadata, source }], [], []);
    const zip = await JSZip.loadAsync(backup);
    const manifest = validateManifest(JSON.parse(await zip.file('manifest.json')!.async('string')));
    expect(manifest.publications).toHaveLength(1);
    const restoredSource = await zip.file(manifest.publications[0].sourcePath)!.async('string');
    expect(restoredSource).toBe('Hello PaperGhost');
    expect(manifest.publications[0].metadata.hash).toBe(await sha256(source));
  });

  it('rejects corrupt source bytes before making an archive', async () => {
    const { metadata } = await fixture();
    await expect(createBackupArchive([{ metadata, source: new Blob(['changed content']) }], [], []))
      .rejects.toThrow('integrity');
  });

  it('rejects unsafe paths, duplicates and invalid manifests', async () => {
    const { metadata } = await fixture();
    const base = {
      kind: 'paperghost.ghostshelf.backup', version: 1,
      createdAt: '2026-11-02T12:00:00Z',
      publications: [{ metadata, sourcePath: 'sources/' + metadata.id + '.bin' }],
      notes: [], receipts: []
    };
    expect(() => validateManifest(base)).not.toThrow();
    expect(() => validateManifest({ ...base, version: 2 })).toThrow('supported');
    expect(() => validateManifest({
      ...base, publications: [{ metadata, sourcePath: '../../bad' }]
    })).toThrow('unsafe');
    expect(() => validateManifest({
      ...base, publications: [base.publications[0], base.publications[0]]
    })).toThrow('duplicate');
    expect(() => validateManifest({
      ...base, notes: [{ id: metadata.id, publicationId: crypto.randomUUID(), text: 'orphan', createdAt: '' }]
    })).toThrow('orphaned');
  });
  it('rejects malicious or invalid bookmark metadata during restore validation', async () => {
    const { metadata } = await fixture();
    const base = {
      kind: 'paperghost.ghostshelf.backup', version: 1, createdAt: '2026-11-02T12:00:00Z',
      publications: [{ metadata: { ...metadata, bookmarks: [{ id: 'unsafe', page: -2, label: '', createdAt: '' }] }, sourcePath: 'sources/' + metadata.id + '.bin' }],
      notes: [], receipts: []
    };
    expect(() => validateManifest(base)).toThrow('invalid publication');
  });
  it('round-trips optional learning progress without changing GhostShelf backup v1', async () => {
    const { source, metadata } = await fixture();
    const progress: LearningProgress = {
      id: 'clear-thinking', completedStepIds: ['question', 'check-evidence'],
      updatedAt: '2026-11-02T21:30:00.000Z'
    };
    const archive = await createBackupArchive([{ metadata, source }], [], [], [progress]);
    const zip = await JSZip.loadAsync(archive);
    const manifest = validateManifest(JSON.parse(await zip.file('manifest.json')!.async('string')));
    expect(manifest.version).toBe(1);
    expect(manifest.learningProgress).toEqual([progress]);
    const olderBackup = { ...manifest };
    delete olderBackup.learningProgress;
    expect(validateManifest(olderBackup).learningProgress).toBeUndefined();
  });

  it('round-trips private journal reflections within the existing ZIP v1 manifest', async () => {
    const progress: LearningProgress = {
      id: 'clear-thinking',
      completedStepIds: ['question'],
      updatedAt: '2026-11-03T00:00:00Z',
      reflections: { question: 'A practical thing I learned today.' }
    };
    const zip = await createBackupArchive([], [], [], [progress]);
    const contents = await JSZip.loadAsync(zip);
    const manifest = validateManifest(JSON.parse(await contents.file('manifest.json')!.async('string')));
    expect(manifest.version).toBe(1);
    expect(manifest.learningProgress?.[0].reflections).toEqual(progress.reflections);
  });

  it('rejects unsafe or excessive journal reflections before restore', async () => {
    const base = {
      kind: 'paperghost.ghostshelf.backup', version: 1,
      createdAt: '2026-11-03T00:00:00Z',
      publications: [], notes: [], receipts: []
    };
    const progress = {
      id: 'clear-thinking', completedStepIds: [], updatedAt: '2026-11-03T00:00:00Z'
    };
    expect(() => validateManifest({
      ...base, learningProgress: [{ ...progress, reflections: { question: 'Valid note' } }]
    })).not.toThrow();
    expect(() => validateManifest({
      ...base, learningProgress: [{ ...progress, reflections: { question: 'x'.repeat(3001) } }]
    })).toThrow('learning trail');
    expect(() => validateManifest({
      ...base, learningProgress: [{ ...progress, reflections: { '../bad': 'Unsafe' } }]
    })).toThrow('learning trail');
    expect(() => validateManifest({
      ...base, learningProgress: [{ ...progress, reflections: { question: 9 } }]
    })).toThrow('learning trail');
  });

  it('rejects malformed or duplicate learning progress records before restoring', async () => {
    const { metadata } = await fixture();
    const base = {
      kind: 'paperghost.ghostshelf.backup', version: 1,
      createdAt: '2026-11-02T21:30:00Z',
      publications: [{ metadata, sourcePath: 'sources/' + metadata.id + '.bin' }],
      notes: [], receipts: []
    };
    const progress = { id: 'clear-thinking', completedStepIds: ['question'], updatedAt: '2026-11-02T21:30:00Z' };
    expect(() => validateManifest({ ...base, learningProgress: [progress] })).not.toThrow();
    expect(() => validateManifest({ ...base, learningProgress: [progress, progress] })).toThrow('learning trail');
    expect(() => validateManifest({ ...base, learningProgress: [{ ...progress, completedStepIds: ['../unsafe'] }] })).toThrow('learning trail');
  });

});
