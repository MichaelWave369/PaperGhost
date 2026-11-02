import type { Publication } from '../types';

export type ReadingBookmark = NonNullable<Publication['bookmarks']>[number];
const MAX_BOOKMARKS = 200;
const MAX_LABEL = 100;

export function canBookmark(publication: Publication): boolean {
  return publication.format === 'pdf' || publication.format === 'cbz' ||
    (publication.format === 'epub' && !!publication.locator);
}

export function defaultBookmarkLabel(publication: Publication): string {
  return publication.format === 'epub' ? 'EPUB reading location' : 'Page ' + publication.page;
}

export function bookmarkMatches(publication: Publication, mark: ReadingBookmark): boolean {
  return publication.format === 'epub'
    ? !!publication.locator && mark.locator === publication.locator
    : mark.page === publication.page;
}

/** Return a new array; never mutate the stored publication or original source. */
export function addBookmark(
  publication: Publication,
  options: { id: string; createdAt: string; label?: string }
): ReadingBookmark[] {
  const bookmarks = publication.bookmarks ?? [];
  if (!canBookmark(publication) || bookmarks.length >= MAX_BOOKMARKS ||
      bookmarks.some(mark => bookmarkMatches(publication, mark))) return bookmarks;

  const label = (options.label ?? '').trim().slice(0, MAX_LABEL) ||
    defaultBookmarkLabel(publication);
  const mark: ReadingBookmark = {
    id: options.id,
    page: publication.page,
    ...(publication.format === 'epub' ? { locator: publication.locator } : {}),
    createdAt: options.createdAt,
    label
  };
  return [...bookmarks, mark];
}

export function removeBookmark(publication: Publication, id: string): ReadingBookmark[] {
  return (publication.bookmarks ?? []).filter(mark => mark.id !== id);
}

/** Returns a target compatible with old publication records and source hashes. */
export function bookmarkTarget(publication: Publication, mark: ReadingBookmark): Pick<Publication, 'page' | 'locator'> {
  return {
    page: mark.page,
    locator: publication.format === 'epub' ? mark.locator : publication.locator
  };
}
