import JSZip from 'jszip';
import type { InkReceipt, PersonalNote, Publication } from '../types';
import type { LearningProgress } from './trails';
import type { WorksheetDraft } from './worksheets';
import { validateWorksheetDraft, MAX_WORKSHEET_DRAFTS } from './worksheets';
import { allLearningProgress, allPublications, allWorksheetDrafts, notesFor, receiptsFor, restoreSnapshot, sourceBlob } from './db';

const BACKUP_KIND = 'paperghost.ghostshelf.backup';
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 550 * 1024 * 1024;
const MAX_SOURCE_BYTES = 100 * 1024 * 1024;
const MAX_RESTORED_TOTAL_BYTES = 500 * 1024 * 1024;
const MAX_PUBLICATIONS = 1000;
const FORMATS = new Set(['pdf', 'epub', 'cbz', 'markdown', 'text', 'image']);
const SKINS = new Set(['book', 'newspaper', 'magazine', 'comic', 'archive']);
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SHA256 = /^[a-f0-9]{64}$/i;

export interface BackupPublication {
  metadata: Publication;
  sourcePath: string;
}

export interface BackupManifest {
  kind: typeof BACKUP_KIND;
  version: number;
  createdAt: string;
  publications: BackupPublication[];
  notes: PersonalNote[];
  receipts: InkReceipt[];
  learningProgress?: LearningProgress[];
  worksheetDrafts?: WorksheetDraft[];
}

export interface RestoreSummary {
  restored: number;
  skipped: number;
  notes: number;
  receipts: number;
  learningTrails: number;
  worksheets: number;
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function string(value: unknown): value is string {
  return typeof value === 'string';
}

function validBookmarks(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 200) return false;
  const ids = new Set<string>();
  for (const mark of value) {
    if (!record(mark) || !UUID.test(String(mark.id)) || ids.has(String(mark.id)) ||
      typeof mark.page !== 'number' || !Number.isSafeInteger(mark.page) || mark.page < 1 ||
      !string(mark.label) || !mark.label.trim() || mark.label.length > 100 ||
      !string(mark.createdAt) ||
      (mark.locator !== undefined && (!string(mark.locator) || mark.locator.length > 10000))) return false;
    ids.add(mark.id as string);
  }
  return true;
}

function validPublication(value: unknown): value is Publication {
  if (!record(value)) return false;
  return UUID.test(String(value.id)) &&
    string(value.title) && value.title.length <= 400 &&
    string(value.fileName) && value.fileName.length <= 600 &&
    FORMATS.has(String(value.format)) &&
    SKINS.has(String(value.skin)) &&
    typeof value.size === 'number' && Number.isSafeInteger(value.size) && value.size > 0 && value.size <= MAX_SOURCE_BYTES &&
    SHA256.test(String(value.hash)) && validBookmarks(value.bookmarks) &&
    typeof value.page === 'number' && Number.isSafeInteger(value.page) && value.page >= 1 &&
    (value.locator === undefined || (string(value.locator) && value.locator.length < 10000)) &&
    string(value.importedAt) && string(value.updatedAt);
}

function validNote(value: unknown): value is PersonalNote {
  return record(value) && UUID.test(String(value.id)) &&
    UUID.test(String(value.publicationId)) && string(value.text) &&
    value.text.length <= 200000 && string(value.createdAt);
}

function validReceipt(value: unknown): value is InkReceipt {
  return record(value) && UUID.test(String(value.id)) &&
    UUID.test(String(value.publicationId)) &&
    ['import', 'note', 'export'].includes(String(value.kind)) &&
    SHA256.test(String(value.sourceSha256)) &&
    string(value.at) && string(value.detail) && value.detail.length <= 20000;
}

function validLearningProgress(value: unknown): value is LearningProgress {
  if (!record(value) || typeof value.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(value.id) ||
      !Array.isArray(value.completedStepIds) || value.completedStepIds.length > 50 ||
      typeof value.updatedAt !== 'string' || value.updatedAt.length > 64) return false;
  const steps = value.completedStepIds;
  if (!steps.every(step => typeof step === 'string' && /^[a-z0-9-]{1,80}$/.test(step)) ||
      new Set(steps).size !== steps.length) return false;
  if (value.reflections !== undefined) {
    if (!record(value.reflections) || Object.keys(value.reflections).length > 50) return false;
    for (const [stepId, note] of Object.entries(value.reflections)) {
      if (!/^[a-z0-9-]{1,80}$/.test(stepId) || typeof note !== 'string' ||
          note.length === 0 || note.length > 3000 || !note.trim()) return false;
    }
  }
  return true;
}

/** Only accept the versioned schema we actually produce. No executable content is restored. */
export function validateManifest(raw: unknown): BackupManifest {
  if (!record(raw) || raw.kind !== BACKUP_KIND || raw.version !== BACKUP_VERSION || !string(raw.createdAt)) {
    throw new Error('This is not a supported PaperGhost GhostShelf v1 backup.');
  }
  if (!Array.isArray(raw.publications) || raw.publications.length > MAX_PUBLICATIONS ||
      !Array.isArray(raw.notes) || raw.notes.length > 100000 ||
      !Array.isArray(raw.receipts) || raw.receipts.length > 100000 ||
      (raw.learningProgress !== undefined && (!Array.isArray(raw.learningProgress) || raw.learningProgress.length > 1000)) ||
      (raw.worksheetDrafts !== undefined && (!Array.isArray(raw.worksheetDrafts) || raw.worksheetDrafts.length > MAX_WORKSHEET_DRAFTS))) {
    throw new Error('The GhostShelf backup has invalid or excessive record counts.');
  }
  const ids = new Set<string>();
  let totalBytes = 0;
  for (const item of raw.publications) {
    if (!record(item) || !validPublication(item.metadata) || !string(item.sourcePath)) {
      throw new Error('The GhostShelf backup contains an invalid publication.');
    }
    const publication = item.metadata;
    if (item.sourcePath !== 'sources/' + publication.id + '.bin' || ids.has(publication.id)) {
      throw new Error('The GhostShelf backup contains a duplicate or unsafe source reference.');
    }
    ids.add(publication.id);
    totalBytes += publication.size;
    if (totalBytes > MAX_RESTORED_TOTAL_BYTES) throw new Error('This backup exceeds the 500 MB restore limit.');
  }
  for (const note of raw.notes) {
    if (!validNote(note) || !ids.has(note.publicationId)) throw new Error('This backup has invalid or orphaned reading notes.');
  }
  for (const receipt of raw.receipts) {
    if (!validReceipt(receipt) || !ids.has(receipt.publicationId)) throw new Error('This backup has invalid or orphaned InkLedger receipts.');
  }
  const noteIds = raw.notes.map(note => note.id as string);
  const receiptIds = raw.receipts.map(receipt => receipt.id as string);
  if (new Set(noteIds).size !== noteIds.length || new Set(receiptIds).size !== receiptIds.length) {
    throw new Error('This backup contains duplicate note or receipt IDs.');
  }
  const learningProgress = (raw.learningProgress ?? []) as unknown[];
  const progressIds = new Set<string>();
  for (const progress of learningProgress) {
    if (!validLearningProgress(progress) || progressIds.has(progress.id)) {
      throw new Error('The backup contains invalid or duplicate learning trail progress.');
    }
    progressIds.add(progress.id);
  }
  const worksheetDrafts = (raw.worksheetDrafts ?? []) as unknown[];
  const draftIds = new Set<string>();
  for (const draft of worksheetDrafts) {
    if (!validateWorksheetDraft(draft) || draftIds.has(draft.id)) {
      throw new Error('The backup contains invalid or duplicate worksheet drafts.');
    }
    draftIds.add(draft.id);
  }
  return raw as unknown as BackupManifest;
}

export async function sha256(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Pure archive helper also used by tests; no IndexedDB interaction. */
export async function createBackupArchive(
  publications: { metadata: Publication; source: Blob }[],
  notes: PersonalNote[],
  receipts: InkReceipt[],
  learningProgress: LearningProgress[] = [],
  worksheetDrafts: WorksheetDraft[] = []
): Promise<Blob> {
  if (publications.length > MAX_PUBLICATIONS) throw new Error('The library exceeds the backup publication limit.');
  const zip = new JSZip();
  const entries: BackupPublication[] = [];
  for (const { metadata, source } of publications) {
    if (source.size !== metadata.size || (await sha256(source)) !== metadata.hash) {
      throw new Error('Source integrity check failed for ' + metadata.title + '. No backup was created.');
    }
    const sourcePath = 'sources/' + metadata.id + '.bin';
    zip.file(sourcePath, new Uint8Array(await source.arrayBuffer()));
    entries.push({ metadata, sourcePath });
  }
  const manifest = validateManifest({
    kind: BACKUP_KIND, version: BACKUP_VERSION,
    createdAt: new Date().toISOString(), publications: entries, notes, receipts, learningProgress, worksheetDrafts
  });
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 3 } });
}

export async function exportShelfBackup(): Promise<Blob> {
  const publications = await allPublications();
  const items: { metadata: Publication; source: Blob }[] = [];
  const notes: PersonalNote[] = [];
  const receipts: InkReceipt[] = [];
  for (const publication of publications) {
    items.push({ metadata: publication, source: await sourceBlob(publication.id) });
    notes.push(...await notesFor(publication.id));
    receipts.push(...await receiptsFor(publication.id));
  }
  return createBackupArchive(items, notes, receipts, await allLearningProgress(), await allWorksheetDrafts());
}

/** Verifies every file before writing any record. A storage transaction commits all records or none. */
export async function restoreShelfBackup(archive: Blob): Promise<RestoreSummary> {
  if (!archive.size || archive.size > MAX_BACKUP_BYTES) {
    throw new Error('Choose a GhostShelf ZIP backup smaller than 550 MB.');
  }
  const zip = await JSZip.loadAsync(archive);
  if (Object.keys(zip.files).length > MAX_PUBLICATIONS + 20) {
    throw new Error('The archive contains too many files.');
  }
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('This ZIP has no PaperGhost manifest.json.');
  const manifestText = await manifestFile.async('string');
  if (manifestText.length > 12 * 1024 * 1024) throw new Error('The backup manifest is too large.');
  let raw: unknown;
  try { raw = JSON.parse(manifestText); }
  catch { throw new Error('The backup manifest is invalid JSON.'); }
  const manifest = validateManifest(raw);
  const existing = await allPublications();
  const byId = new Map(existing.map(item => [item.id, item]));
  const sources: { publication: Publication; source: Blob }[] = [];
  const skipped = new Set<string>();

  for (const item of manifest.publications) {
    const saved = byId.get(item.metadata.id);
    if (saved && saved.hash !== item.metadata.hash) {
      throw new Error('A different local publication already has this backup ID. No changes were made.');
    }
    const entry = zip.file(item.sourcePath);
    if (!entry) throw new Error('A backed-up source file is missing: ' + item.metadata.title);
    const data = await entry.async('blob');
    if (data.size !== item.metadata.size || (await sha256(data)) !== item.metadata.hash) {
      throw new Error('A backed-up source failed the integrity check: ' + item.metadata.title + '. No changes were made.');
    }
    if (saved) {
      skipped.add(item.metadata.id);
    } else {
      sources.push({ publication: item.metadata, source: data });
    }
  }

  // Existing local trail progress wins; a restored archive cannot silently reset it.
  const existingProgress = await allLearningProgress();
  const knownProgressIds = new Set(existingProgress.map(progress => progress.id));
  const incomingProgress = (manifest.learningProgress ?? [])
    .filter(progress => !knownProgressIds.has(progress.id));

  // Never silently overwrite a local worksheet with a copy from a backup.
  const existingDrafts = await allWorksheetDrafts();
  const localDraftIds = new Set(existingDrafts.map(draft => draft.id));
  const incomingDrafts = (manifest.worksheetDrafts ?? [])
    .filter(draft => !localDraftIds.has(draft.id));

  // Preserve existing publication reading state and restore all new records atomically.
  await restoreSnapshot(sources, manifest.notes, manifest.receipts, incomingProgress, incomingDrafts);
  return {
    restored: sources.length,
    skipped: skipped.size,
    notes: manifest.notes.length,
    receipts: manifest.receipts.length,
    learningTrails: incomingProgress.length,
    worksheets: incomingDrafts.length
  };
}
