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

GlobalWorkerOptions.workerSrc = workerUrl;

interface ReaderProps {
  publication: Publication;
  onChange: (publication: Publication) => void;
  onClose: () => void;
}

function PageControls({ page, total, onPage }: { page: number; total: number; onPage: (page: number) => void }) {
  return (
    <nav className="page-controls" aria-label="Page navigation">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Previous</button>
      <span aria-live="polite">Page {page} / {total}</span>
      <button type="button" disabled={page >= total} onClick={() => onPage(page + 1)}>Next →</button>
    </nav>
  );
}

function usePageArrows(page: number, total: number, onPage: (page: number) => void) {
  const onPageRef = useRef(onPage);
  onPageRef.current = onPage;
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.altKey || event.metaKey || event.ctrlKey || target?.closest('input,textarea,select,button')) return;
      if (event.key === 'ArrowRight' && page < total) onPageRef.current(page + 1);
      if (event.key === 'ArrowLeft' && page > 1) onPageRef.current(page - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [page, total]);
}

function PdfPages({ blob, publication, onPage }: { blob: Blob; publication: Publication; onPage: (page: number) => void }) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState('');
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
        canvas.width = Math.round(scaled.width);
        canvas.height = Math.round(scaled.height);
        canvas.style.width = Math.round(viewport.width * scale) + 'px';
        canvas.style.height = Math.round(viewport.height * scale) + 'px';
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is unavailable.');
        renderTask = page.render({ canvasContext: context, viewport: scaled });
        await renderTask.promise;
      } catch (reason) {
        if (!cancelled && !(reason instanceof Error && reason.name === 'RenderingCancelledException')) setError(String(reason));
      }
    })();
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [pdf, publication.page]);

  const pageCount = pdf?.numPages || 1;
  usePageArrows(publication.page, pageCount, onPage);
  return (
    <div className="document-viewer">
      {error ? <p className="error" role="alert">{error}</p> : null}
      {!pdf && !error ? <p>Unfolding the PDF…</p> : null}
      <div className="pdf-canvas-wrap" ref={wrapRef}><canvas aria-label={'PDF page ' + publication.page} ref={canvasRef} /></div>
      {pdf ? <PageControls page={publication.page} total={pageCount} onPage={onPage} /> : null}
    </div>
  );
}

function ComicPages({ blob, publication, onPage }: { blob: Blob; publication: Publication; onPage: (page: number) => void }) {
  const [archive, setArchive] = useState<{ zip: JSZip; entries: string[] } | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const zip = await JSZip.loadAsync(await blob.arrayBuffer());
        const entries = Object.keys(zip.files).filter(name => !zip.files[name].dir && /\.(png|jpe?g|webp|gif|avif)$/i.test(name)).sort(naturalCompare);
        if (!entries.length) throw new Error('This CBZ contains no supported image pages.');
        if (active) setArchive({ zip, entries });
      } catch (reason) { if (active) setError(String(reason)); }
    })();
    return () => { active = false; };
  }, [blob]);

  useEffect(() => {
    if (!archive) return;
    let active = true;
    let url = '';
    void (async () => {
      const entry = archive.zip.file(archive.entries[Math.min(publication.page - 1, archive.entries.length - 1)]);
      if (!entry) return;
      const imgBlob = await entry.async('blob');
      if (!active) return;
      url = URL.createObjectURL(imgBlob);
      setImageUrl(url);
    })().catch(reason => { if (active) setError(String(reason)); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); setImageUrl(''); };
  }, [archive, publication.page]);
  const count = archive?.entries.length || 1;
  usePageArrows(publication.page, count, onPage);
  return (
    <div className="document-viewer">
      {error ? <p className="error" role="alert">{error}</p> : null}
      {!archive && !error ? <p>Opening the comic archive…</p> : null}
      {imageUrl ? <img className="comic-page" src={imageUrl} alt={'Comic page ' + publication.page} /> : null}
      {archive ? <PageControls page={publication.page} total={count} onPage={onPage} /> : null}
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
  const onLocatorRef = useRef(onLocator);
  onLocatorRef.current = onLocator;
  const [error, setError] = useState('');

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
          if (active && locator) onLocatorRef.current(locator);
        });
        await rendition.display(publication.locator || undefined);
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
          <button type="button" onClick={() => { setShowNotes(value => !value); setShowLedger(false); }} aria-pressed={showNotes}>Notes ({notes.length})</button>
          <button type="button" onClick={() => { setShowLedger(value => !value); setShowNotes(false); }} aria-pressed={showLedger}>InkLedger</button>
        </div>
      </header>
      <div className="reader-content">
        <main className="paper-stage">
          <div className="edition-label">{publication.skin.toUpperCase()} EDITION · PAPERGHOST</div>
          {error ? <p className="error" role="alert">{error}</p> : null}
          {!blob && !error ? <p className="loading">Opening your local publication…</p> : null}
          {blob && publication.format === 'pdf' ? <PdfPages blob={blob} publication={publication} onPage={changePage} /> : null}
          {blob && publication.format === 'cbz' ? <ComicPages blob={blob} publication={publication} onPage={changePage} /> : null}
          {blob && publication.format === 'image' ? <ImagePage blob={blob} /> : null}
          {blob && publication.format === 'epub' ? <EpubPages blob={blob} publication={publication} onLocator={changeLocator} /> : null}
          {blob && (publication.format === 'markdown' || publication.format === 'text') ? <TextPages blob={blob} markdown={publication.format === 'markdown'} /> : null}
        </main>
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
