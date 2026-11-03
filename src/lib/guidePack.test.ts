import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { createStarterPackZip, getGuidePackItems, installedGuidePublicationIds, planGuidePack, PACK_FILE_NAME } from './guidePack';
import { ORIGINAL_GUIDES } from './commons';
import type { Publication } from '../types';

function publication(fileName: string, hash: string): Publication {
  return {
    id: crypto.randomUUID(), title: fileName, fileName, hash, format: 'markdown',
    size: 100, page: 1, skin: 'book',
    importedAt: '2026-11-02', updatedAt: '2026-11-02'
  };
}

describe('Human Essentials offline starter pack', () => {
  it('addresses the original guides by actual source bytes, not filenames alone', async () => {
    const items = await getGuidePackItems();
    expect(items).toHaveLength(ORIGINAL_GUIDES.length);
    for (const item of items) expect(item.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(new Set(items.map(item => item.hash)).size).toBe(items.length);
    expect(planGuidePack([], items).missing).toHaveLength(8);
    const first = items[0];
    expect(planGuidePack([publication(first.fileName, 'b'.repeat(64))], items).missing).toHaveLength(8);
    expect(planGuidePack([publication(first.fileName, first.hash)], items).installed).toHaveLength(1);
    expect(installedGuidePublicationIds([publication(first.fileName, 'f'.repeat(64))], items).size).toBe(0);
    const exact = publication(first.fileName, first.hash);
    expect(installedGuidePublicationIds([exact], items).get(first.id)).toBe(exact.id);
    expect(planGuidePack([publication(first.fileName, first.hash)], items).missing).toHaveLength(7);
    expect(planGuidePack(items.map(item => publication(item.fileName, item.hash)), items).missing).toHaveLength(0);
  });

  it('builds a ZIP containing 8 guides and 8 blank worksheets with matching SHA-256 checksums', async () => {
    expect(PACK_FILE_NAME).toMatch(/\.zip$/);
    const blob = await createStarterPackZip();
    expect(blob.size).toBeGreaterThan(1000);
    const zip = await JSZip.loadAsync(blob);
    const manifest = JSON.parse(await zip.file('manifest.json')!.async('string'));
    expect(manifest.kind).toBe('paperghost.human-essentials.starter-pack');
    expect(manifest.version).toBe(1);
    expect(manifest.entries).toHaveLength(16);
    expect(manifest.entries.filter((e: any) => e.kind === 'original-guide')).toHaveLength(8);
    expect(manifest.entries.filter((e: any) => e.kind === 'blank-worksheet')).toHaveLength(8);
    for (const entry of manifest.entries) {
      const contents = await zip.file(entry.path)!.async('uint8array');
      const digest = await crypto.subtle.digest('SHA-256', contents);
      const hex = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
      expect(hex).toBe(entry.sha256);
      expect(contents.length).toBe(entry.bytes);
    }
    expect(await zip.file('README.md')!.async('string')).toContain('never includes personal information');
    expect(await zip.file('LICENSE.txt')!.async('string')).toContain('MIT License');
    expect(zip.file(/\.epub$|\.pdf$/i)).toHaveLength(0);
  });
});
