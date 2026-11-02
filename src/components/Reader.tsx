import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import JSZip from 'jszip';
import ePub from 'epubjs';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { InkReceipt, PersonalNote, Publication, PageSkin } from '../types';
import { PAGE_SKINS } from '../types';
import { addNote, addReceipt, notesFor, receiptsFor, sourceBlob } from '../lib/db';
import { friendlyBytes, localDate, naturalCompare } from '../lib/utils';
import { GhostMark } from './GhostMark';
import { addBookmark, bookmarkMatches, bookmarkTarget, canBookmark, removeBookmark } from '../lib/bookmarks';
import { comicNextPage, comicPreviousPage, comicSpreadPages, comicSpreadStart, PDF_FOLD_REGIONS } from '../lib/readingLayout';
import type { FoldRegion } from '../lib/readingLayout';

GlobalWorkerOptions.workerSrc = workerUrl;

interface ReaderProps {
  publication: Publication;
  onChange: (publication: Publication) => void;
  onClose: () => void;
}

function PageJump({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  const [target, setTarget] = useState(String(page));
  useEffect(() => { setTarget(String(page)); }, [page]);
  return (
    <form className="page-jump" onSubmit={event => {
      event.preventDefault();
      const next = Number(target);
      if (Number.isSafeInteger(next) && next >= 1 && next <= total) onPage(next);
    }}>
      <label htmlFor="reading-jump-page">Go to page</label>
      <input id="reading-jump-page" aria-label="Page number" type="number" min={1} max={total} value={target} onChange={event => setTarget(event.target.value)} />
      <button type="submit" disabled={!target || !Number.isSafeInteger(Number(target)) || Number(target) < 1 || Number(target) > total}>Go</button>
    </form>
  );
}

function PageControls({ page, total, onPage, step = 1, label }: {
  page: number; total: number; onPage: (page: number) => void; step?: number; label?: string;
}) {
  return (
    <nav className="page-controls" aria-label="Page navigation">
      <button type="button" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - step))}>← Previous</button>
      <span aria-live="polite">{label || ('Page ' + page + ' / ' + total)}</span>
      <PageJump page={page} total={total} onPage={onPage} />
      <button type="button" disabled={page + step > total} onClick={() => onPage(page + step)}>Next →</button>
    </nav>
  );
}

function usePageArrows(
  page: number, total: number, onPage: (page: number) => void,
  step = 1, direction: 'ltr' | 'rtl' = 'ltr'
) {
  const onPageRef = useRef(onPage);
  onPageRef.current = onPage;
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.altKey || event.metaKey || event.ctrlKey || target?.closest('input,textarea,select,button')) return;
      const isNext = event.key === (direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      const isPrevious = event.key === (direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
      if (isNext && page + step <= total) {
        event.preventDefault();
        onPageRef.current(page + step);
      } else if (isPrevious && page > 1) {
        event.preventDefault();
        onPageRef.current(Math.max(1, page - step));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [page, total, step, direction]);
}

function PdfPages({ blob, publication, onPage }: {
  blob: Blob; publication: Publication; onPage: (page: number) => void;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState('');
  const [fold, setFold] = useState<FoldRegion>('whole');
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<typeof getDocument> | undefined;
    void (async () => {
      try {
        loadingTask = getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
        const doc = await loadingTask.promise;
        if (cancelled) { await doc.destroy(); return; }
        setPdf(doc);
      } catch (reason) {
        if (!cancelled) setError(String(reason));
      }
    })();
    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [blob]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !wrapRef.current) return;
    let cancelled = false;
    let renderTask: RenderTask | undefined;
    void (async () => {
      try {
        const page = await pdf.getPage(Math.min(publication.page, pdf.numPages));
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1 });
        const desiredWidth = Math.min(1024, Math.max(250, (wrapRef.current?.clientWidth || 780) - 32));
        const scale = desiredWidth / viewport.width;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const scaled = page.getViewport({ scale: scale * ratio });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = Math.round(viewport.width * scale);
        const height = Math.round(viewport.height * scale);
        canvas.width = Math.round(scaled.width);
        canvas.height = Math.round(scaled.height);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is unavailable.');
        renderTask = page.render({ canvasContext: context, viewport: scaled });
        await renderTask.promise;
        if (!cancelled) setCanvasSize({ width, height });
      } catch (reason) {
        if (!cancelled && !(reason instanceof Error && reason.name === 'RenderingCancelledException')) setError(String(reason));
      }
    })();
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [pdf, publication.page]);

  const pageCount = pdf?.numPages || 1;
  const activeFold = publication.skin === 'newspaper' ? fold : 'whole';
  usePageArrows(publication.page, pageCount, onPage);
  return (
    <div className="document-viewer">
      {error ? <p className="error" role="alert">{error}</p> : null}
      {!pdf && !error ? <p>Unfolding the PDF…</p> : null}
      {pdf && publication.skin === 'newspaper' ? (
        <div className="pdf-fold-toolbar">
          <label htmlFor="newspaper-fold-region">Newspaper fold</label>
          <select id="newspaper-fold-region" value={fold} onChange={event => setFold(event.target.value as FoldRegion)}>
            {PDF_FOLD_REGIONS.map(region => <option key={region.value} value={region.value}>{region.label}</option>)}
          </select>
          <span>Zoom into a quarter of the original page, without changing the document.</span>
        </div>
      ) : null}
      <div className="pdf-canvas-wrap" ref={wrapRef}>
        <div
          className={'pdf-fold-frame fold-' + activeFold}
          style={canvasSize ? { width: canvasSize.width, height: canvasSize.height } : undefined}
        >
          <canvas aria-label={'PDF page ' + publication.page + (activeFold !== 'whole' ? ', ' + activeFold.replace('-', ' ') : '')} ref={canvasRef} />
        </div>
      </div>
      {pdf ? <PageControls page={publication.page} total={pageCount} onPage={onPage} /> : null}
    </div>
  );
}

function ComicPages({ blob, publication, onPage, onPreferences }: {
  blob: Blob;
  publication: Publication;
  onPage: (page: number) => void;
  onPreferences: (changes: Partial<Pick<Publication, 'comicDirection' | 'comicSpread'>>) => void;
}) {
  const [archive, setArchive] = useState<{ zip: JSZip; entries: string[] } | null>(null);
  const [images, setImages] = useState<{ page: number; url: string }[]>([]);
  const [error, setError] = useState('');
  const direction = publication.comicDirection ?? 'ltr';
  const spread = publication.comicSpread ?? false;

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const zip = await JSZip.loadAsync(await blob.arrayBuffer());
        const entries = Object.keys(zip.files)
          .filter(name => !zip.files[name].dir && /\.(png|jpe?g|webp|gif|avif)$/i.test(name) && !name.startsWith('__MACOSX/'))
          .sort(naturalCompare);
        if (!entries.length) throw new Error('This CBZ contains no supported image pages.');
        if (active) setArchive({ zip, entries });
      } catch (reason) { if (active) setError(String(reason)); }
    })();
    return () => { active = false; };
  }, [blob]);

  const count = archive?.entries.length || 1;
  const start = comicSpreadStart(publication.page, count, spread);
  const visiblePages = comicSpreadPages(publication.page, count, spread, direction);

  useEffect(() => {
    if (!archive) return;
    let active = true;
    let createdUrls: string[] = [];
    setImages([]);
    setError('');
    void (async () => {
      const decoded = await Promise.all(visiblePages.map(async pageNumber => {
        const entry = archive.zip.file(archive.entries[pageNumber - 1]);
        if (!entry) throw new Error('Page ' + pageNumber + ' could not be found in the archive.');
        return { page: pageNumber, blob: await entry.async('blob') };
      }));
      if (!active) return;
      const nextImages = decoded.map(item => ({
        page: item.page, url: URL.createObjectURL(item.blob)
      }));
      createdUrls = nextImages.map(item => item.url);
      setImages(nextImages);
    })().catch(reason => { if (active) setError(String(reason)); });
    return () => {
      active = false;
      createdUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [archive, publication.page, spread, direction]);

  const step = spread ? 2 : 1;
  const next = () => onPage(comicNextPage(start, count, spread));
  const previous = () => onPage(comicPreviousPage(start, count, spread));
  usePageArrows(start, count, onPage, step, direction);
  return (
    <div className="document-viewer">
      <div className="comic-reading-toolbar">
        <label>
          <input type="checkbox" checked={spread} onChange={event => onPreferences({ comicSpread: event.target.checked })} />
          Two-page spread
        </label>
        <label htmlFor="comic-reading-direction">Reading direction</label>
        <select id="comic-reading-direction" value={direction} onChange={event => onPreferences({ comicDirection: event.target.value as 'ltr' | 'rtl' })}>
          <option value="ltr">Left → right</option>
          <option value="rtl">Right ← left (manga)</option>
        </select>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
      {!archive && !error ? <p>Opening the comic archive…</p> : null}
      <div className={'comic-spread' + (spread ? ' two-up' : '')} role="group" aria-label={spread ? 'Two-page comic spread' : 'Comic page'}>
        {images.map(image => <img key={image.page} className="comic-page" src={image.url} alt={'Comic page ' + image.page} />)}
      </div>
      {archive ? (
        <nav className="page-controls" aria-label="Comic page navigation">
          <button type="button" disabled={start <= 1} onClick={previous}>← Previous</button>
          <span aria-live="polite">Page {start}{spread && visiblePages.length === 2 ? '–' + (start + 1) : ''} / {count}</span>
          <PageJump page={start} total={count} onPage={onPage} />
          <button type="button" disabled={start + step > count} onClick={next}>Next →</button>
        </nav>
      ) : null}
    </div>
  );
}

function ImagePage({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const imageUrl = URL.createObjectURL(blob);
    setUrl(imageUrl);
    return () => URL.revokeObjectURL(imageUrl);
  }, [blob]);
  return <div className="document-viewer">{url ? <img className="comic-page" src={url} alt="Imported scanned page" /> : null}</div>;
}

function TextPages({ blob, markdown }: { blob: Blob; markdown: boolean }) {
  const [content, setContent] = useState('');
  useEffect(() => {
    let active = true;
    void blob.text().then(text => { if (active) setContent(text); });
    return () => { active = false; };
  }, [blob]);
  return (
    <div className="text-page">
      {markdown ? <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{content}</ReactMarkdown> : <pre className="plain-text">{content}</pre>}
    </div>
  );
}

function EpubPages({ blob, publication, onLocator }: { blob: Blob; publication: Publication; onLocator: (locator: string) => void }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const renderedLocatorRef = useRef<string | undefined>(undefined);
  const desiredLocatorRef = useRef(publication.locator);
  desiredLocatorRef.current = publication.locator;
  const onLocatorRef = useRef(onLocator);
  onLocatorRef.current = onLocator;
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.altKey || event.metaKey || event.ctrlKey || target?.closest('input,textarea,select,button')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        if (event.key === 'ArrowRight') void renditionRef.current?.next();
        else void renditionRef.current?.prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    let active = true;
    let book: any;
    void (async () => {
      try {
        const buffer = await blob.arrayBuffer();
        if (!active || !elementRef.current) return;
        book = ePub(buffer);
        const rendition = book.renderTo(elementRef.current, { width: '100%', height: '100%', flow: 'paginated', spread: 'none' });
        renditionRef.current = rendition;
        rendition.on('relocated', (location: any) => {
          const locator = location?.start?.cfi;
          if (active && locator) { renderedLocatorRef.current = locator; onLocatorRef.current(locator); }
        });
        await rendition.display(desiredLocatorRef.current || undefined);
      } catch (reason) {
        if (active) setError(String(reason));
      }
    })();
    return () => {
      active = false;
      renditionRef.current = null;
      if (book) book.destroy();
    };
  }, [blob, publication.id]);

  // External bookmark jumps move the active rendition without remounting the EPUB.
  useEffect(() => {
    const requested = publication.locator;
    const rendition = renditionRef.current;
    if (!requested || !rendition || requested === renderedLocatorRef.current) return;
    renderedLocatorRef.current = requested;
    void Promise.resolve(rendition.display(requested)).catch((reason: unknown) => {
      setError('Could not open this saved EPUB location: ' + String(reason));
    });
  }, [publication.locator]);

  return (
    <div className="epub-reader">
      {error ? <p className="error" role="alert">EPUB could not open: {error}</p> : null}
      <div className="epub-frame" ref={elementRef} aria-label="EPUB book pages" />
      <nav className="page-controls" aria-label="EPUB page navigation">
        <button type="button" onClick={() => renditionRef.current?.prev()}>← Previous</button>
        <span>EPUB edition</span>
        <button type="button" onClick={() => renditionRef.current?.next()}>Next →</button>
      </nav>
    </div>
  );
}

export function Reader({ publication, onChange, onClose }: ReaderProps) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [receipts, setReceipts] = useState<InkReceipt[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let active = true;
    void sourceBlob(publication.id).then(value => { if (active) setBlob(value); }).catch(reason => { if (active) setError(String(reason)); });
    void notesFor(publication.id).then(value => { if (active) setNotes(value); });
    void receiptsFor(publication.id).then(value => { if (active) setReceipts(value); });
    return () => { active = false; };
  }, [publication.id]);

  const changePage = (page: number) => onChange({ ...publication, page: Math.max(1, page), updatedAt: new Date().toISOString() });
  const changeLocator = (locator: string) => {
    if (locator !== publication.locator) onChange({ ...publication, locator, updatedAt: new Date().toISOString() });
  };
  const changeSkin = (skin: PageSkin) => onChange({ ...publication, skin, updatedAt: new Date().toISOString() });

  const savedBookmarks = publication.bookmarks ?? [];
  const bookmarkable = canBookmark(publication);
  const alreadyBookmarked = savedBookmarks.some(mark => bookmarkMatches(publication, mark));
  const saveBookmark = () => {
    if (!bookmarkable || alreadyBookmarked) return;
    const now = new Date().toISOString();
    const marks = addBookmark(publication, { id: crypto.randomUUID(), createdAt: now, label: bookmarkLabel });
    onChange({ ...publication, bookmarks: marks, updatedAt: now });
    setBookmarkLabel('');
  };
  const jumpBookmark = (mark: NonNullable<Publication['bookmarks']>[number]) => {
    const target = bookmarkTarget(publication, mark);
    onChange({ ...publication, ...target, updatedAt: new Date().toISOString() });
  };
  const deleteBookmark = (id: string) => {
    onChange({ ...publication, bookmarks: removeBookmark(publication, id), updatedAt: new Date().toISOString() });
  };

  const saveNote = async () => {
    if (!draft.trim()) return;
    const at = new Date().toISOString();
    await addNote({ id: crypto.randomUUID(), publicationId: publication.id, text: draft.trim(), createdAt: at });
    await addReceipt({
      id: crypto.randomUUID(), publicationId: publication.id, kind: 'note',
      sourceSha256: publication.hash, at, detail: 'Added a private reading note'
    });
    setNotes(await notesFor(publication.id));
    setReceipts(await receiptsFor(publication.id));
    setDraft('');
  };

  const exportLedger = async () => {
    const at = new Date().toISOString();
    await addReceipt({
      id: crypto.randomUUID(), publicationId: publication.id, kind: 'export',
      sourceSha256: publication.hash, at, detail: 'Exported InkLedger JSON receipt bundle'
    });
    const entries = await receiptsFor(publication.id);
    setReceipts(entries);
    const output = new Blob([JSON.stringify({ publication: { id: publication.id, title: publication.title, fileName: publication.fileName, sha256: publication.hash }, receipts: entries }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(output);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'paperghost-inkledger-' + publication.id.slice(0, 8) + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className={'reader-shell skin-' + publication.skin}>
      <header className="reader-header">
        <button className="subtle-button" type="button" onClick={onClose}>← GhostShelf</button>
        <div className="reader-heading"><GhostMark size={30}/><div><strong>{publication.title}</strong><small>{publication.format.toUpperCase()} · {friendlyBytes(publication.size)}</small></div></div>
        <div className="reader-actions">
          <label className="skin-select">PageSkin
            <select value={publication.skin} onChange={event => changeSkin(event.target.value as PageSkin)}>
              {PAGE_SKINS.map(skin => <option key={skin} value={skin}>{skin[0].toUpperCase() + skin.slice(1)}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => { setShowBookmarks(value => !value); setShowNotes(false); setShowLedger(false); }} aria-pressed={showBookmarks}>Bookmarks ({savedBookmarks.length})</button>
          <button type="button" onClick={() => { setShowNotes(value => !value); setShowLedger(false); setShowBookmarks(false); }} aria-pressed={showNotes}>Notes ({notes.length})</button>
          <button type="button" onClick={() => { setShowLedger(value => !value); setShowNotes(false); setShowBookmarks(false); }} aria-pressed={showLedger}>InkLedger</button>
        </div>
      </header>
      <div className="reader-content">
        <main className="paper-stage">
          <div className="edition-label">{publication.skin.toUpperCase()} EDITION · PAPERGHOST</div>
          {error ? <p className="error" role="alert">{error}</p> : null}
          {!blob && !error ? <p className="loading">Opening your local publication…</p> : null}
          {blob && publication.format === 'pdf' ? <PdfPages blob={blob} publication={publication} onPage={changePage} /> : null}
          {blob && publication.format === 'cbz' ? <ComicPages blob={blob} publication={publication} onPage={changePage} onPreferences={changes => onChange({ ...publication, ...changes, updatedAt: new Date().toISOString() })} /> : null}
          {blob && publication.format === 'image' ? <ImagePage blob={blob} /> : null}
          {blob && publication.format === 'epub' ? <EpubPages blob={blob} publication={publication} onLocator={changeLocator} /> : null}
          {blob && (publication.format === 'markdown' || publication.format === 'text') ? <TextPages blob={blob} markdown={publication.format === 'markdown'} /> : null}
        </main>
        {showBookmarks ? (
          <aside className="reader-sidebar" aria-label="Reading bookmarks">
            <h2>Reading bookmarks</h2>
            <p>Return to your favorite pages without changing the original document.</p>
            {bookmarkable ? (
              <div className="bookmark-creator">
                <label htmlFor="bookmark-name">Bookmark label (optional)</label>
                <input id="bookmark-name" maxLength={100} placeholder={publication.format === 'epub' ? 'EPUB reading location' : 'Page ' + publication.page} value={bookmarkLabel} onChange={event => setBookmarkLabel(event.target.value)} />
                <button type="button" disabled={alreadyBookmarked || savedBookmarks.length >= 200} onClick={saveBookmark}>
                  {alreadyBookmarked ? 'Page already saved' : 'Save this location'}
                </button>
              </div>
            ) : <p className="sidebar-empty">Bookmarks currently support PDF, CBZ and EPUB reading locations. EPUB locations become available after the book opens.</p>}
            {!savedBookmarks.length ? <p className="sidebar-empty">No saved locations yet.</p> : null}
            {savedBookmarks.map(mark => (
              <div className="bookmark-entry" key={mark.id}>
                <div>
                  <strong>{mark.label}</strong>
                  <small>{publication.format === 'epub' ? 'EPUB location' : 'Page ' + mark.page} · {localDate(mark.createdAt)}</small>
                </div>
                <div className="bookmark-actions">
                  <button type="button" onClick={() => jumpBookmark(mark)} aria-label={'Go to ' + mark.label}>Open</button>
                  <button type="button" onClick={() => deleteBookmark(mark.id)} aria-label={'Remove bookmark ' + mark.label}>Remove</button>
                </div>
              </div>
            ))}
          </aside>
        ) : null}
        {showNotes ? (
          <aside className="reader-sidebar" aria-label="Personal notes">
            <h2>Margin notes</h2>
            <p>Private notes live outside the imported source.</p>
            <textarea value={draft} onChange={event => setDraft(event.target.value)} rows={5} placeholder="Write a thought worth keeping…" aria-label="New personal note"/>
            <button type="button" onClick={() => void saveNote()} disabled={!draft.trim()}>Save note</button>
            {notes.length ? notes.map(note => <div className="note" key={note.id}><small>{localDate(note.createdAt)}</small><p>{note.text}</p></div>) : <p className="sidebar-empty">No notes yet.</p>}
          </aside>
        ) : null}
        {showLedger ? (
          <aside className="reader-sidebar" aria-label="InkLedger provenance">
            <h2>InkLedger</h2>
            <p>Source SHA-256</p>
            <code className="hash">{publication.hash}</code>
            <p>Original: {publication.fileName}</p>
            <p>Imported: {localDate(publication.importedAt)}</p>
            <button type="button" onClick={() => void exportLedger()}>Download JSON receipts</button>
            {receipts.map(receipt => <div className="note" key={receipt.id}><small>{localDate(receipt.at)} · {receipt.kind}</small><p>{receipt.detail}</p></div>)}
          </aside>
        ) : null}
      </div>
      <footer className="reader-footer">Original source preserved · Local by default · Paper is memory</footer>
    </section>
  );
}
