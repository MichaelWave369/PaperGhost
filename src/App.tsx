import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import type { Publication } from './types';
import { allPublications, deletePublication, savePublication } from './lib/db';
import { importFile } from './lib/imports';
import { exportShelfBackup, restoreShelfBackup } from './lib/backup';
import { demoFile } from './lib/demo';
import { guideFile } from './lib/commons';
import type { OfflineGuide } from './lib/commons';
import { CommonsLibrary } from './components/CommonsLibrary';
import { friendlyBytes, localDate } from './lib/utils';
import { Reader } from './components/Reader';
import { GhostMark } from './components/GhostMark';

const formatNames: Record<Publication['format'], string> = {
  pdf: 'Archive', epub: 'Book', cbz: 'Comic', markdown: 'Field notes', text: 'Manuscript', image: 'Image'
};
const formatSymbols: Record<Publication['format'], string> = {
  pdf: '✦', epub: '❧', cbz: '✶', markdown: '¶', text: '§', image: '◇'
};

function App() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [ready, setReady] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void allPublications().then(items => {
      if (active) { setPublications(items); setReady(true); }
    }).catch(reason => {
      if (active) { setError('GhostShelf could not open: ' + String(reason)); setReady(true); }
    });
    return () => { active = false; };
  }, []);

  const refresh = async () => setPublications(await allPublications());

  const importFiles = async (files: File[]) => {
    if (!files.length || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    let count = 0;
    const failures: string[] = [];
    try {
      for (const file of files) {
        try { await importFile(file); count++; }
        catch (reason) { failures.push(String(reason instanceof Error ? reason.message : reason)); }
      }
      await refresh();
      if (count) setNotice(count + (count === 1 ? ' publication' : ' publications') + ' added to your local GhostShelf.');
      if (failures.length) setError(failures.join(' '));
    } catch (reason) {
      setError('Could not update GhostShelf: ' + String(reason));
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };


  const downloadBackup = async () => {
    if (busy || !publications.length) return;
    setBusy(true);
    setError('');
    try {
      const archive = await exportShelfBackup();
      const url = URL.createObjectURL(archive);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'PaperGhost-GhostShelf-' + new Date().toISOString().slice(0, 10) + '.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      setNotice('GhostShelf backup prepared. Keep the downloaded ZIP somewhere safe; it includes your source files and private notes.');
    } catch (reason) {
      setError('GhostShelf backup failed: ' + String(reason));
    } finally { setBusy(false); }
  };

  const importBackup = async (file?: File) => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const summary = await restoreShelfBackup(file);
      await refresh();
      setNotice('Restored ' + summary.restored + ' publications; ' + summary.skipped +
        ' already on this shelf. Notes and InkLedger receipts were included.');
    } catch (reason) {
      setError('Could not restore GhostShelf: ' + String(reason));
    } finally {
      setBusy(false);
      if (backupInput.current) backupInput.current.value = '';
    }
  };

  const openFieldGuide = async (guide: OfflineGuide) => {
    if (busy) return;
    const existing = publications.find(publication => publication.fileName === 'Field-Library-' + guide.id + '.md');
    if (existing) { setActiveId(existing.id); return; }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const publication = await importFile(guideFile(guide));
      await refresh();
      setActiveId(publication.id);
    } catch (reason) {
      setError('Field Guide could not open: ' + String(reason));
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    if (activeId) return;
    void importFiles(Array.from(event.dataTransfer.files));
  };

  const updatePublication = (publication: Publication) => {
    setPublications(items => items.map(item => item.id === publication.id ? publication : item));
    void savePublication(publication).catch(reason => setError('Reading position not saved: ' + String(reason)));
  };

  const removePublication = async (publication: Publication) => {
    if (!window.confirm('Remove ' + publication.title + ' and its local notes/receipts from this browser?')) return;
    try {
      await deletePublication(publication.id);
      if (activeId === publication.id) setActiveId(null);
      await refresh();
      setNotice('Removed from this browser. Your original file is unchanged.');
    } catch (reason) { setError(String(reason)); }
  };

  const activePublication = publications.find(publication => publication.id === activeId);
  const visible = publications.filter(publication => (publication.title + ' ' + publication.fileName + ' ' + publication.format).toLowerCase().includes(query.toLowerCase().trim()));
  const totalSize = publications.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className={'app-shell' + (dragging ? ' is-dragging' : '')} onDragOver={event => { if (!activeId) { event.preventDefault(); setDragging(true); } }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={onDrop}>
      <a href="#main" className="skip-link">Skip to content</a>
      {activePublication ? (
        <Reader key={activePublication.id} publication={activePublication} onChange={updatePublication} onClose={() => setActiveId(null)} />
      ) : (
        <>
          <header className="topbar">
            <a href={import.meta.env.BASE_URL} className="brand" aria-label="PaperGhost home">
              <GhostMark size={43} />
              <span>PaperGhost<small>THE DIGITAL PAPER VESSEL</small></span>
            </a>
            <div className="topbar-right"><span className="offline-tag"><span aria-hidden="true">●</span> LOCAL-FIRST</span><a href="#commons-library">Free Library</a><a href="https://github.com/MichaelWave369/PaperGhost" target="_blank" rel="noreferrer">Source &amp; roadmap ↗</a></div>
          </header>
          <main id="main">
            <section className="masthead" aria-labelledby="hero-title">
              <div className="masthead-inner">
                <div className="overline"><span>ENTER THE FIELD PRESSROOM</span><span>VOL. I · ISSUE 000</span></div>
                <div className="masthead-content">
                  <div className="hero-text">
                    <p className="eyebrow">A HOME FOR LIVING PUBLICATIONS</p>
                    <h1 id="hero-title">The ghost in<br />the <em>paper.</em></h1>
                    <p className="manifesto">Screens gave us access. Paper gave us presence. <strong>PaperGhost gives us both.</strong></p>
                    <p className="hero-description">Your books, comics, manuscripts and forgotten paper treasures. One beautiful shelf, owned by you, inside your browser.</p>
                    <div className="hero-buttons">
                      <button className="primary-button" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? 'Importing…' : '+ Add publications'}</button>
                      <button className="outline-button" disabled={busy} onClick={() => void importFiles([demoFile()])}>Open Issue Zero</button>
                      <a href="#commons-library" className="outline-button library-hero-link">Browse free library</a>
                    </div>
                    <p className="privacy-caption">Private by default. Files stay in this browser. No account required.</p>
                  </div>
                  <div className="hero-art" aria-hidden="true">
                    <div className="back-sheet sheet-one"></div>
                    <div className="back-sheet sheet-two"></div>
                    <div className="hero-paper"><div className="paper-topline">THE PAPERGHOST EDITION</div><div className="paper-illustration"><GhostMark size={115}/></div><p className="paper-title">PAPER<br/>IS MEMORY.</p><div className="paper-rule"></div><p className="paper-subtitle">PRESENCE IS REAL.</p><div className="paper-bottomline">A NEW KIND OF OLD FRIEND · MMXXVI</div></div>
                  </div>
                </div>
              </div>
            </section>
            <section className="shelf-section" aria-labelledby="shelf-title">
              <div className="section-topline"><span>01 / YOUR COLLECTION</span><span>GHOSTSHELF · PRIVATE LIBRARY</span></div>
              <div className="shelf-heading">
                <div><p className="eyebrow">EVERY PAGE HAS A PLACE</p><h2 id="shelf-title">Your GhostShelf<span className="title-star">✳</span></h2></div>
                <div className="shelf-tools"><label className="search-label" htmlFor="shelf-search">Search collection</label><input id="shelf-search" type="search" placeholder="Search your shelf…" value={query} onChange={event => setQuery(event.target.value)}/><button className="outline-button small" disabled={busy || !publications.length} onClick={() => void downloadBackup()} title="Save your entire local library, including source files and private notes">Backup ZIP</button><button className="outline-button small" disabled={busy} onClick={() => backupInput.current?.click()} title="Restore a PaperGhost GhostShelf backup">Restore ZIP</button><button className="outline-button small" disabled={busy} onClick={() => fileInput.current?.click()}>+ Import</button></div>
              </div>
              <p className="backup-guidance">Your browser is not a permanent vault. Use <strong>Backup ZIP</strong> to keep a portable copy of originals, notes, and receipts. Backups are not encrypted.</p>
              <div className="shelf-stats"><span>{publications.length} PUBLICATIONS</span><span>{friendlyBytes(totalSize)} STORED LOCALLY</span><span>NO CLOUD REQUIRED</span></div>
              {error ? <div className="message error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div> : null}
              {notice ? <div className="message notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss notice">×</button></div> : null}
              {!ready ? <p className="loading">Opening GhostShelf…</p> : null}
              {ready && !publications.length ? (
                <div className="empty-shelf">
                  <GhostMark size={72}/>
                  <h3>Every great library starts with a first page.</h3>
                  <p>Your shelf is empty. Import a file from your device or open our little Pressroom demo issue.</p>
                  <div className="empty-actions"><button className="primary-button" onClick={() => fileInput.current?.click()}>Bring your own paper</button><button className="outline-button" onClick={() => void importFiles([demoFile()])}>Read Issue Zero</button></div>
                  <small>Supports PDF, EPUB, CBZ, MD / MDX, TXT, JPG, PNG and WebP. 100 MB limit per file.</small>
                </div>
              ) : null}
              {ready && publications.length > 0 && !visible.length ? <p className="no-results">No titles match your search.</p> : null}
              <div className="publication-grid">
                {visible.map((publication, index) => (
                  <article className={'publication-card cover-' + publication.format} key={publication.id}>
                    <button className="publication-cover" onClick={() => setActiveId(publication.id)} aria-label={'Read ' + publication.title}>
                      <span className="cover-kicker">{formatNames[publication.format].toUpperCase()}</span>
                      <span className="cover-symbol" aria-hidden="true">{formatSymbols[publication.format]}</span>
                      <strong>{publication.title}</strong>
                      <span className="cover-footer">PAPERGHOST · Nº {String(index + 1).padStart(3, '0')}</span>
                    </button>
                    <div className="publication-meta"><div><strong>{publication.title}</strong><small>{formatNames[publication.format]} · {localDate(publication.importedAt)}</small></div><div className="pub-actions"><button type="button" onClick={() => setActiveId(publication.id)}>Read ↗</button><button type="button" className="delete-button" onClick={() => void removePublication(publication)} aria-label={'Remove ' + publication.title}>×</button></div></div>
                  </article>
                ))}
              </div>
              {publications.length > 0 ? <div className="drop-hint">Drop more PDF, EPUB, CBZ or text files anywhere on the shelf to import.</div> : null}
            </section>
            <CommonsLibrary
              publications={publications}
              busy={busy}
              onAddGuide={guide => void openFieldGuide(guide)}
              onOpenPublication={setActiveId}
            />
            <section className="system-strip" aria-labelledby="system-title">
              <p className="eyebrow" id="system-title">BENEATH THE PAGE</p>
              <div className="system-grid">
                <div><span className="system-number">I.</span><h3>CodexOS</h3><p>The format-aware engine that opens your digital publications.</p></div>
                <div><span className="system-number">II.</span><h3>PageSkin</h3><p>Reading atmospheres that respect the publication, not a feed.</p></div>
                <div><span className="system-number">III.</span><h3>InkLedger</h3><p>SHA-256 source receipts and separate personal notes.</p></div>
                <div><span className="system-number">IV.</span><h3>GhostShelf</h3><p>Your local collection, reading position and publications.</p></div>
              </div>
            </section>
          </main>
          <footer className="site-footer"><span>✳ ENTER THE FIELD · PAPERGHOST</span><span>PAPER IS MEMORY. PRESENCE IS REAL.</span><span>MIT OPEN SOURCE · 2026</span></footer>
          {dragging ? <div className="drop-overlay" aria-hidden="true">RELEASE TO ADD TO GHOSTSHELF</div> : null}
          <input ref={backupInput} className="visually-hidden" type="file" accept=".zip,application/zip" aria-label="Restore GhostShelf ZIP backup" onChange={event => void importBackup(event.target.files?.[0])} />
          <input ref={fileInput} className="visually-hidden" aria-label="Import publication files" type="file" multiple accept=".pdf,.epub,.cbz,.md,.mdx,.markdown,.txt,.jpg,.jpeg,.png,.webp,.gif,.avif" onChange={event => void importFiles(Array.from(event.target.files || []))} />
        </>
      )}
    </div>
  );
}

export default App;
