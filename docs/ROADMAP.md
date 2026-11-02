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

## Rung 2: CodexOS format intelligence

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
