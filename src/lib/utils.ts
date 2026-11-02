import type { PageSkin, PublicationFormat } from '../types';

export function detectFormat(name: string): PublicationFormat | null {
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'epub') return 'epub';
  if (ext === 'cbz') return 'cbz';
  if (ext === 'md' || ext === 'mdx' || ext === 'markdown') return 'markdown';
  if (ext === 'txt') return 'text';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'].includes(ext || '')) return 'image';
  return null;
}

export function titleFromFile(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled publication';
}

export function defaultSkin(format: PublicationFormat): PageSkin {
  if (format === 'cbz' || format === 'image') return 'comic';
  if (format === 'pdf') return 'archive';
  return 'book';
}

export function friendlyBytes(size: number): string {
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function localDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
