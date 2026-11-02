import type { Publication } from '../types';
import { addReceipt, storeImport } from './db';
import { defaultSkin, detectFormat, titleFromFile } from './utils';

const MAX_IMPORT_BYTES = 100 * 1024 * 1024;

export async function importFile(file: File): Promise<Publication> {
  const format = detectFormat(file.name);
  if (!format) throw new Error('Unsupported file: ' + file.name + '. Try PDF, EPUB, CBZ, MD, MDX, TXT or an image.');
  if (file.size > MAX_IMPORT_BYTES) throw new Error(file.name + ' is larger than the current 100 MB import limit.');
  if (!file.size) throw new Error(file.name + ' is empty.');

  const data = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const now = new Date().toISOString();
  const publication: Publication = {
    id: crypto.randomUUID(),
    title: titleFromFile(file.name),
    fileName: file.name,
    format,
    size: file.size,
    hash,
    importedAt: now,
    updatedAt: now,
    page: 1,
    skin: defaultSkin(format)
  };

  // Source bytes remain unchanged; reading state and annotations live separately.
  await storeImport(publication, new Blob([data], { type: file.type || 'application/octet-stream' }));
  await addReceipt({
    id: crypto.randomUUID(),
    publicationId: publication.id,
    kind: 'import',
    sourceSha256: hash,
    at: now,
    detail: 'Local import of ' + file.name
  });
  return publication;
}
