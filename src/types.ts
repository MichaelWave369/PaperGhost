export type PublicationFormat = 'pdf' | 'epub' | 'cbz' | 'markdown' | 'text' | 'image';
export type PageSkin = 'book' | 'newspaper' | 'magazine' | 'comic' | 'archive';

export interface Publication {
  id: string;
  title: string;
  fileName: string;
  format: PublicationFormat;
  size: number;
  hash: string;
  importedAt: string;
  updatedAt: string;
  page: number;
  locator?: string;
  comicDirection?: 'ltr' | 'rtl';
  comicSpread?: boolean;
  skin: PageSkin;
}

export interface PersonalNote {
  id: string;
  publicationId: string;
  text: string;
  createdAt: string;
}

export interface InkReceipt {
  id: string;
  publicationId: string;
  kind: 'import' | 'note' | 'export';
  sourceSha256: string;
  at: string;
  detail: string;
}

export const PAGE_SKINS: PageSkin[] = ['book', 'newspaper', 'magazine', 'comic', 'archive'];
