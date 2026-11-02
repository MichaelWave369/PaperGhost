import { describe, it, expect } from 'vitest';
import type { Publication } from '../types';
import { addBookmark, bookmarkMatches, bookmarkTarget, canBookmark, removeBookmark } from './bookmarks';

function book(format: Publication['format'] = 'pdf'): Publication {
  return {
    id: '12340000-1234-4234-8234-123412341234', title: 'A test title',
    fileName: 'test.pdf', format, size: 200, hash: 'a'.repeat(64),
    importedAt: '2026-11-02T00:00:00Z', updatedAt: '2026-11-02T00:00:00Z',
    page: 4, skin: 'book'
  };
}
const options = { id: 'abcdefab-1234-4234-8234-abcdefabcdef', createdAt: '2026-11-02T00:00:00Z' };

describe('CodexOS reading bookmarks', () => {
  it('adds and persists a page bookmark without mutating the publication', () => {
    const pub = book('pdf');
    const marks = addBookmark(pub, options);
    expect(marks).toHaveLength(1);
    expect(marks[0].label).toBe('Page 4');
    expect(marks[0].page).toBe(4);
    expect(pub.bookmarks).toBeUndefined();
    expect(bookmarkMatches(pub, marks[0])).toBe(true);
    expect(addBookmark({ ...pub, bookmarks: marks }, options)).toEqual(marks);
    expect(removeBookmark({ ...pub, bookmarks: marks }, marks[0].id)).toEqual([]);
  });
  it('uses EPUB locators rather than unreliable page counts', () => {
    const pub = { ...book('epub'), locator: 'epubcfi(/6/4!/4/10)' };
    expect(canBookmark(pub)).toBe(true);
    const marks = addBookmark(pub, { ...options, label: ' Chapter 3 ' });
    expect(marks[0].label).toBe('Chapter 3');
    expect(marks[0].locator).toBe(pub.locator);
    const later = { ...pub, locator: 'epubcfi(/6/8!/4/10)', page: 4 };
    expect(bookmarkMatches(later, marks[0])).toBe(false);
    expect(bookmarkTarget(later, marks[0])).toEqual({ page: 4, locator: pub.locator });
  });
  it('avoids meaningless bookmarks when content has no stable page/locator', () => {
    expect(canBookmark(book('markdown'))).toBe(false);
    expect(canBookmark(book('epub'))).toBe(false);
    expect(addBookmark(book('markdown'), options)).toEqual([]);
  });
  it('limits stored bookmark counts and label length', () => {
    const pub = book();
    const marks = addBookmark(pub, { ...options, label: 'x'.repeat(500) });
    expect(marks[0].label.length).toBe(100);
    const full = Array.from({ length: 200 }, (_, index) => ({ ...marks[0], id: String(index), page: index + 1 }));
    expect(addBookmark({ ...pub, page: 201, bookmarks: full }, options)).toHaveLength(200);
  });
});
