# PaperGhost product roadmap

Source: PaperGhost / CodexOS Master Design Spec v0.1, July 4, 2026.

## Rung 1: reader proof (this PR)

- Vite/React installable PWA hosted statically on GitHub Pages.
- Private local GhostShelf in IndexedDB, with original file blobs.
- PDF, EPUB, CBZ, Markdown/MDX as safe Markdown, text and single-image imports.
- PDF page navigation, EPUB paginated reading, CBZ image navigation, Markdown reading.
- PageSkin-inspired presentation presets: Book, Newspaper, Magazine, Comic, Archive.
- Plain-text personal notes, bookmarks/reading position, SHA-256 import receipts.
- Built-in demo issue for first-run exploration.
- Keyboard, reduced-motion, and responsive layout support.

## Rung 2a: GhostShelf portability (this PR)

- Download the library as a portable ZIP with full original sources, reading state, notes, and InkLedger receipts.
- Verify SHA-256 integrity before exporting and restoring; reject unsupported or unsafe archive manifests.
- Restore only new publications without replacing existing reading positions.
- Restore all entries in one IndexedDB transaction; add clear browser data-loss and unencrypted-backup warnings.
- Automated archive and manifest validation tests.

## Rung 2b: CodexOS reading rituals (this PR)

- Newspaper PDF quarter-sheet fold/zoom positions with whole-page escape hatch. Source geometry preserved.
- CBZ two-page spreads and persistent manga right-to-left direction controls.
- Direction-aware comic keyboard paging and EPUB keyboard page turns.
- Pure reading-order tests, accessible controls, and responsive reader styles.

## Rung 2c: CodexOS Reading Desk (this PR)

- Persistent per-publication named reading bookmarks for PDF, CBZ and EPUB.
- EPUB bookmark navigation via CFI without reloading the publication.
- Numeric page jumps for PDF and comic archives.
- Backward-compatible GhostShelf ZIP bookmark export/restore, input validation and pure logic tests.

## Rung 2d: CodexOS format intelligence (future)

- Faithful versus reflow views, EPUB locations/chapters, PDF text overlays.
- Newspaper fold navigation and native section hierarchy.
- Comic panel maps / right-to-left direction, page-spread locks.
- Full-text local index and accessibility QA.
- Import folder, batch metadata editing, richer annotations.
- File size/memory performance audits and worker-backed processing.

## Rung 3: Enter the Field Pressroom

- Editor templates, layout blocks, cover creator, issue manifest.
- Branded publication packs: Bro Terms, build logs, comics, field reports.
- Static HTML and PDF publishing with full asset provenance.
- Issue 001 through the same pipeline external creators will use.

## Rung 4: ecosystem & devices

- Optional PhiOS, PhiArk, PhiOffice, and PhiOS-Mobile adapters.
- Portable shelf/receipt format; optional explicit consent-based sync.
- XR spatial library experiments and e-paper device validation.

## Boundaries

PaperGhost is MIT open source. Importing does not grant publishing rights. No DRM circumvention. Never silently change an imported source. OCR, if added, must always be labeled as an interpretation. Encryption and cloud sync are not promised in v0.1; browser-local storage is not encrypted and may be deleted by browser storage cleanup.
