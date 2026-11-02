import { describe, expect, it } from 'vitest';
import { defaultSkin, detectFormat, friendlyBytes, naturalCompare, titleFromFile } from './utils';

describe('CodexOS format classification', () => {
  it('recognizes the initial reading corpus', () => {
    expect(detectFormat('a.PDF')).toBe('pdf');
    expect(detectFormat('book.epub')).toBe('epub');
    expect(detectFormat('chapters.cbz')).toBe('cbz');
    expect(detectFormat('issue.mdx')).toBe('markdown');
    expect(detectFormat('issue.md')).toBe('markdown');
    expect(detectFormat('scan.png')).toBe('image');
    expect(detectFormat('copyrighted.cbr')).toBeNull();
    expect(detectFormat('unsafe.exe')).toBeNull();
  });
  it('supplies intelligible titles and skins', () => {
    expect(titleFromFile('Field_Report-001.pdf')).toBe('Field Report 001');
    expect(defaultSkin('cbz')).toBe('comic');
    expect(defaultSkin('pdf')).toBe('archive');
    expect(defaultSkin('epub')).toBe('book');
  });
  it('orders comic pages numerically', () => {
    expect(['10.png', '2.png', '1.png'].sort(naturalCompare)).toEqual(['1.png', '2.png', '10.png']);
  });
  it('describes file sizes', () => {
    expect(friendlyBytes(512)).toBe('512 B');
    expect(friendlyBytes(2048)).toBe('2.0 KB');
  });
});
