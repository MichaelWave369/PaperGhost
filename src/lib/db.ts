import type { InkReceipt, PersonalNote, Publication } from '../types';

const DB_NAME = 'paperghost-local';
const DB_VERSION = 1;
type StoreName = 'publications' | 'sources' | 'notes' | 'receipts';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
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
