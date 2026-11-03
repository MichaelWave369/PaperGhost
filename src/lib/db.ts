import type { InkReceipt, PersonalNote, Publication } from '../types';
import type { LearningProgress } from './trails';
import type { WorksheetDraft } from './worksheets';

const DB_NAME = 'paperghost-local';
const DB_VERSION = 3;
type StoreName = 'publications' | 'sources' | 'notes' | 'receipts' | 'learningProgress' | 'worksheetDrafts';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('publications')) db.createObjectStore('publications', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('sources')) db.createObjectStore('sources', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('notes')) {
        const notes = db.createObjectStore('notes', { keyPath: 'id' });
        notes.createIndex('publicationId', 'publicationId');
      }
      if (!db.objectStoreNames.contains('receipts')) {
        const receipts = db.createObjectStore('receipts', { keyPath: 'id' });
        receipts.createIndex('publicationId', 'publicationId');
      }
      if (!db.objectStoreNames.contains('learningProgress')) {
        db.createObjectStore('learningProgress', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('worksheetDrafts')) {
        db.createObjectStore('worksheetDrafts', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('The PaperGhost database is blocked by another tab.'));
  });
}

async function put(store: StoreName, value: object): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDatabase();
  try {
    return await new Promise<T[]>((resolve, reject) => {
      const request = db.transaction(store, 'readonly').objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function allPublications(): Promise<Publication[]> {
  return (await getAll<Publication>('publications')).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function storeImport(publication: Publication, data: Blob): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['publications', 'sources'], 'readwrite');
      tx.objectStore('publications').put(publication);
      tx.objectStore('sources').put({ id: publication.id, blob: data });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export async function savePublication(publication: Publication): Promise<void> {
  await put('publications', publication);
}

export async function sourceBlob(id: string): Promise<Blob> {
  const db = await openDatabase();
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const request = db.transaction('sources', 'readonly').objectStore('sources').get(id);
      request.onsuccess = () => {
        if (request.result?.blob) resolve(request.result.blob as Blob);
        else reject(new Error('This publication has no local source. Please re-import it.'));
      };
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function allLearningProgress(): Promise<LearningProgress[]> {
  return getAll<LearningProgress>('learningProgress');
}
export async function saveLearningProgress(progress: LearningProgress): Promise<void> {
  await put('learningProgress', progress);
}

export async function allWorksheetDrafts(): Promise<WorksheetDraft[]> {
  return getAll<WorksheetDraft>('worksheetDrafts');
}
export async function saveWorksheetDraft(draft: WorksheetDraft): Promise<void> {
  await put('worksheetDrafts', draft);
}
export async function deleteWorksheetDraft(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('worksheetDrafts', 'readwrite');
      tx.objectStore('worksheetDrafts').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export async function addNote(note: PersonalNote): Promise<void> { await put('notes', note); }
export async function addReceipt(receipt: InkReceipt): Promise<void> { await put('receipts', receipt); }

export async function notesFor(publicationId: string): Promise<PersonalNote[]> {
  const notes = await getAll<PersonalNote>('notes');
  return notes.filter(note => note.publicationId === publicationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function receiptsFor(publicationId: string): Promise<InkReceipt[]> {
  const receipts = await getAll<InkReceipt>('receipts');
  return receipts.filter(receipt => receipt.publicationId === publicationId).sort((a, b) => b.at.localeCompare(a.at));
}

export async function deletePublication(id: string): Promise<void> {
  const [notes, receipts] = await Promise.all([notesFor(id), receiptsFor(id)]);
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['publications', 'sources', 'notes', 'receipts'], 'readwrite');
      tx.objectStore('publications').delete(id);
      tx.objectStore('sources').delete(id);
      notes.forEach(note => tx.objectStore('notes').delete(note.id));
      receipts.forEach(receipt => tx.objectStore('receipts').delete(receipt.id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

/** One IndexedDB transaction protects restored sources, metadata, notes and receipts as a unit. */
export async function restoreSnapshot(
  entries: { publication: Publication; source: Blob }[],
  notes: PersonalNote[],
  receipts: InkReceipt[],
  learningProgress: LearningProgress[] = [],
  worksheetDrafts: WorksheetDraft[] = []
): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['publications', 'sources', 'notes', 'receipts', 'learningProgress', 'worksheetDrafts'], 'readwrite');
      for (const entry of entries) {
        tx.objectStore('publications').put(entry.publication);
        tx.objectStore('sources').put({ id: entry.publication.id, blob: entry.source });
      }
      for (const note of notes) tx.objectStore('notes').put(note);
      for (const receipt of receipts) tx.objectStore('receipts').put(receipt);
      for (const progress of learningProgress) tx.objectStore('learningProgress').put(progress);
      for (const draft of worksheetDrafts) tx.objectStore('worksheetDrafts').put(draft);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
