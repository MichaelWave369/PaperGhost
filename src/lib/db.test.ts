import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { allLearningProgress, allPublications, allWorksheetDrafts, saveWorksheetDraft, saveLearningProgress, sourceBlob } from './db';

describe('GhostShelf IndexedDB legacy migration to v3', () => {
  it('retains existing publications, sources and notes, and adds progress without resetting data', async () => {
    const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('paperghost-local', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('publications', { keyPath: 'id' });
        db.createObjectStore('sources', { keyPath: 'id' });
        const notes = db.createObjectStore('notes', { keyPath: 'id' });
        notes.createIndex('publicationId', 'publicationId');
        const receipts = db.createObjectStore('receipts', { keyPath: 'id' });
        receipts.createIndex('publicationId', 'publicationId');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = legacy.transaction(['publications', 'sources', 'notes'], 'readwrite');
        tx.objectStore('publications').put({
          id: 'legacy-book', title: 'Before Trails', fileName: 'before.md', format: 'markdown',
          size: 15, hash: 'a'.repeat(64), importedAt: '2026-01-01', updatedAt: '2026-01-01',
          page: 1, skin: 'book'
        });
        tx.objectStore('sources').put({ id: 'legacy-book', blob: new Blob(['the original book']) });
        tx.objectStore('notes').put({
          id: 'legacy-note', publicationId: 'legacy-book', text: 'keep this note', createdAt: '2026-01-01'
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } finally {
      legacy.close();
    }
    const books = await allPublications();
    expect(books.map(book => book.id)).toContain('legacy-book');
    expect(await (await sourceBlob('legacy-book')).text()).toBe('the original book');
    const progress = {
      id: 'clear-thinking', completedStepIds: ['question'], updatedAt: '2026-11-02T22:00:00Z'
    };
    await saveLearningProgress(progress);
    expect(await allLearningProgress()).toEqual([progress]);
    expect(await (await sourceBlob('legacy-book')).text()).toBe('the original book');
    const worksheet = { id: 'weekly-map', content: '# My plan', updatedAt: '2026-11-02T23:00:00Z', templateRevision: 1 };
    await saveWorksheetDraft(worksheet);
    expect(await allWorksheetDrafts()).toEqual([worksheet]);
    expect(await (await sourceBlob('legacy-book')).text()).toBe('the original book');
  });
});
