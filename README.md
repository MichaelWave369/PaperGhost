# PaperGhost 👻

**Screens gave us access. Paper gave us presence. PaperGhost gives us both.**

PaperGhost is a local-first, open-source digital paper vessel for books, comics, archival scans, newspapers, magazines, zines, field notes and manuals. CodexOS is its format-aware engine, GhostShelf is the local collection, PageSkin supplies reading atmospheres, and InkLedger captures provenance receipts.

Created from the July 4, 2026 *PaperGhost / CodexOS Master Design Spec v0.1*. The original Pressroom concept now ships under **Enter the Field Pressroom**.

## Reader prototype (Rung 1)

- React + TypeScript + Vite PWA, hosted statically with no application backend.
- Imports PDF, EPUB, CBZ, MD/MDX (as safe Markdown), TXT, PNG, JPEG, WebP, GIF, and AVIF from your device.
- Keeps the original imported source Blob in local IndexedDB, together with a SHA-256 receipt.
- Provides PDF page navigation, EPUB paginated reading, CBZ comic navigation with natural image ordering, and safe text rendering.
- Stores reading position, PageSkin preference, personal reading notes and InkLedger JSON receipts locally.
- Includes Book, Newspaper, Magazine, Comic, and Archive presentation presets, plus built-in Pressroom Issue 000.
- Mobile-responsive, keyboard-friendly, reduced-motion-aware, MIT licensed.

**Important v0.1 limits:** Imported publications are stored **only in this browser's origin**; clearing site data, using private browsing, changing devices or reinstalling browsers can delete the library. IndexedDB is **not encrypted**, is not an archival backup, and browser storage limits apply. Always keep your original files. MDX is rendered as Markdown, never executed as code. PDF source pages are preserved as pages rather than reflowed. CBR, OCR, DRM circumvention, magazine authoring, actual newspaper folding and cross-device sync are not implemented.

## CodexOS reading rituals (Rung 2b)

- **Newspaper Mode with PDF:** choose Whole sheet, Upper left/right, or Lower left/right. Quarter-page folding enlarges the original page image without modifying source bytes. It is a visual crop, not OCR or article recognition.
- **Comic Mode with CBZ:** toggle two-page spreads and left-to-right/right-to-left ordering. Choices persist per publication; the pair order and keyboard arrows follow reading direction. This is not yet a comic panel recognition engine.
- **EPUB keyboard navigation:** left/right arrows turn pages without needing to click next/previous.

The browser stores reading preferences locally alongside your GhostShelf collection. The original source remains unchanged.

## Portable GhostShelf backups

Use **Backup ZIP** from GhostShelf to download the full local collection: original source bytes, publication metadata, last reading position, personal notes, and InkLedger receipts. Use **Restore ZIP** to merge a backup into another browser. Backup manifests are versioned and source hashes are verified before applying any writes; existing publication IDs are not overwritten. Files stay in your browser unless you explicitly download a backup. **The ZIP is not encrypted** and may contain personal reading notes: store and share it carefully. Backups are limited to 500 MB of uncompressed originals in this early release.

## Run locally

Requirements: Node.js 22+ and npm.

1. Clone this repository.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the address printed by Vite.

Quality checks: `npm run typecheck`, `npm test`, `npm run build`.

## GitHub Pages deployment

The workflow at .github/workflows/pages.yml publishes the built /PaperGhost/ app when changes reach main. In GitHub repository settings, select **Pages → Build and deployment → GitHub Actions**. Once deployed, the intended URL is https://michaelwave369.github.io/PaperGhost/ . This is a target URL, not a claim that deployment has already occurred.

## Architecture

| Component | Responsibility |
| --- | --- |
| PaperGhost | Reader surface, library entry point |
| CodexOS | Format classification, source handling, page rendering |
| GhostShelf | Browser-local IndexedDB library and source files |
| PageSkin | Selectable reading atmosphere per publication |
| InkLedger | Source hash and append-only local receipt records |
| Enter the Field Pressroom | Built-in sample issue; future creation tools |

See [docs/ROADMAP.md](docs/ROADMAP.md) for next stages.

## Values

Software first, hardware later. Source bytes remain unmodified. Personal imports are private by default; never assume a right to redistribute third-party works. Basic reading does not require accounts or subscriptions. Keep accessibility and honest receipts above spectacle.

MIT License © 2026 Michael Hughes and contributors.
