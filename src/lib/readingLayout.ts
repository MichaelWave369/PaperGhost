/** CodexOS reading-order helpers, independent of DOM and archive codecs. */
export type FoldRegion = 'whole' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type ComicDirection = 'ltr' | 'rtl';

export const PDF_FOLD_REGIONS: { value: FoldRegion; label: string }[] = [
  { value: 'whole', label: 'Whole sheet' },
  { value: 'top-left', label: 'Upper left' },
  { value: 'top-right', label: 'Upper right' },
  { value: 'bottom-left', label: 'Lower left' },
  { value: 'bottom-right', label: 'Lower right' }
];

/** The opening page of a spread is always an odd 1-based page. */
export function comicSpreadStart(page: number, count: number, spread: boolean): number {
  if (!Number.isInteger(count) || count < 1) return 1;
  const safePage = Math.min(Math.max(Number.isInteger(page) ? page : 1, 1), count);
  return spread ? 2 * Math.floor((safePage - 1) / 2) + 1 : safePage;
}

export function comicSpreadPages(page: number, count: number, spread: boolean, direction: ComicDirection): number[] {
  if (!Number.isInteger(count) || count < 1) return [];
  const first = comicSpreadStart(page, count, spread);
  const pages = spread && first + 1 <= count ? [first, first + 1] : [first];
  return direction === 'rtl' ? pages.reverse() : pages;
}

export function comicNextPage(page: number, count: number, spread: boolean): number {
  const first = comicSpreadStart(page, count, spread);
  return Math.min(count, first + (spread ? 2 : 1));
}

export function comicPreviousPage(page: number, count: number, spread: boolean): number {
  const first = comicSpreadStart(page, count, spread);
  return Math.max(1, first - (spread ? 2 : 1));
}
