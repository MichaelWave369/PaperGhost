import { describe, expect, it } from 'vitest';
import { comicNextPage, comicPreviousPage, comicSpreadPages, comicSpreadStart, PDF_FOLD_REGIONS } from './readingLayout';

describe('CodexOS newspaper fold controls', () => {
  it('includes whole-sheet geometry before any quadrant crop', () => {
    expect(PDF_FOLD_REGIONS.map(region => region.value)).toEqual([
      'whole', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
    ]);
  });
});

describe('CodexOS comic reading order', () => {
  it('shows each page in single page mode', () => {
    expect(comicSpreadPages(3, 7, false, 'ltr')).toEqual([3]);
    expect(comicNextPage(3, 7, false)).toBe(4);
    expect(comicPreviousPage(3, 7, false)).toBe(2);
  });
  it('shows two pages side by side, preserving the original reading order', () => {
    expect(comicSpreadStart(4, 7, true)).toBe(3);
    expect(comicSpreadPages(3, 7, true, 'ltr')).toEqual([3, 4]);
    expect(comicSpreadPages(3, 7, true, 'rtl')).toEqual([4, 3]);
    expect(comicNextPage(3, 7, true)).toBe(5);
    expect(comicPreviousPage(3, 7, true)).toBe(1);
  });
  it('handles odd final pages and out of range saved positions', () => {
    expect(comicSpreadPages(7, 7, true, 'ltr')).toEqual([7]);
    expect(comicSpreadPages(9, 7, true, 'rtl')).toEqual([7]);
    expect(comicSpreadPages(-8, 7, true, 'ltr')).toEqual([1, 2]);
    expect(comicSpreadPages(1, 0, true, 'ltr')).toEqual([]);
    expect(comicNextPage(7, 7, true)).toBe(7);
  });
});
