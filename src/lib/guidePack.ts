import JSZip from 'jszip';
import type { Publication } from '../types';
import { ORIGINAL_GUIDES, guideFile, guideFileName } from './commons';
import { FIELD_WORKSHEETS } from './worksheets';

export const PACK_FILE_NAME = 'PaperGhost-Human-Essentials-Starter-Pack.zip';

export interface GuidePackItem {
  id: string;
  fileName: string;
  hash: string;
  size: number;
}
export interface GuidePackPlan {
  installed: GuidePackItem[];
  missing: GuidePackItem[];
  total: number;
}

async function sha256Bytes(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Content-addressed guide identity, so a similarly named personal file never passes as our guide. */
export async function getGuidePackItems(): Promise<GuidePackItem[]> {
  return Promise.all(ORIGINAL_GUIDES.map(async guide => {
    const file = guideFile(guide);
    return {
      id: guide.id,
      fileName: guideFileName(guide.id),
      hash: await sha256Bytes(await file.arrayBuffer()),
      size: file.size
    };
  }));
}

/** Resolve only the exact original source, not a same-named user document. */
export function installedGuidePublicationIds(
  publications: readonly Publication[], items: readonly GuidePackItem[]
): Map<string, string> {
  const bySource = new Map(publications.map(publication => [
    publication.fileName + ':' + publication.hash.toLowerCase(), publication.id
  ]));
  const installed = new Map<string, string>();
  for (const item of items) {
    const id = bySource.get(item.fileName + ':' + item.hash);
    if (id) installed.set(item.id, id);
  }
  return installed;
}

export function planGuidePack(publications: readonly Publication[], items: readonly GuidePackItem[]): GuidePackPlan {
  const present = new Set(publications.map(item => item.fileName + ':' + item.hash.toLowerCase()));
  return {
    installed: items.filter(item => present.has(item.fileName + ':' + item.hash)),
    missing: items.filter(item => !present.has(item.fileName + ':' + item.hash)),
    total: items.length
  };
}

const MIT_LICENSE = `MIT License

Copyright (c) 2026 Michael Hughes and PaperGhost contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

const PACK_README = `# PaperGhost · Human Essentials Starter Pack

**Knowledge above gatekeeping. People above profit.**

This is a portable collection of original MIT-licensed PaperGhost content.
You may read, copy, print, adapt and share it under the included LICENSE.txt.

## What's inside

- field-guides/: 8 complete original Markdown reading guides.
- worksheets/: 8 blank, reusable Markdown practical templates.
- manifest.json: SHA-256 integrity hashes, filenames and provenance.
- LICENSE.txt: MIT license text.

## Read it offline

Open Markdown files in any compatible editor, or import the Field Guide files into PaperGhost's private GhostShelf.
PaperGhost can also add all eight guides directly to GhostShelf with its "Add 8 guides locally" action.
To keep a copy of your *personal* books, notes, journal reflections, worksheet drafts and reading progress,
use **GhostShelf → Backup ZIP**. This starter pack never includes personal information.

## Sources and limitations

This archive contains **only original PaperGhost guides and blank worksheets**.
No external OpenStax textbooks, Project Gutenberg books or government documents are redistributed here.
Outside resources in the PaperGhost catalog require visiting their respective publisher sites.

The files are unencrypted. Avoid adding passwords or sensitive private details to shared copies.
Health, money and safety templates are for general education, not personalized professional advice.

© 2026 Michael Hughes and PaperGhost contributors · MIT License
`;

export async function createStarterPackZip(): Promise<Blob> {
  const zip = new JSZip();
  const entries: { path: string; sha256: string; bytes: number; kind: string }[] = [];
  for (const guide of ORIGINAL_GUIDES) {
    const path = 'field-guides/' + guideFileName(guide.id);
    const data = new TextEncoder().encode(guide.content);
    zip.file(path, data);
    entries.push({
      path, sha256: await sha256Bytes(data.buffer as ArrayBuffer),
      bytes: data.byteLength, kind: 'original-guide'
    });
  }
  for (const worksheet of FIELD_WORKSHEETS) {
    const path = 'worksheets/Field-Worksheet-' + worksheet.id + '.md';
    const data = new TextEncoder().encode(worksheet.markdown);
    zip.file(path, data);
    entries.push({
      path, sha256: await sha256Bytes(data.buffer as ArrayBuffer),
      bytes: data.byteLength, kind: 'blank-worksheet'
    });
  }
  zip.file('README.md', PACK_README);
  zip.file('LICENSE.txt', MIT_LICENSE);
  zip.file('manifest.json', JSON.stringify({
    kind: 'paperghost.human-essentials.starter-pack',
    version: 1,
    rights: 'Original PaperGhost materials · MIT license (LICENSE.txt)',
    entries
  }, null, 2));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 4 } });
}
