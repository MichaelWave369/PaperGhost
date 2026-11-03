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

## Private Field Journals (Rung 7)

Every step of the Human Essentials learning trails now has an **optional personal reflection**. Readers may write up to 3,000 characters about what they tried, learned, or would do differently. Entries save **only when the reader explicitly selects "Save reflection"**. Writing a reflection does not automatically check off a trail activity.

- **Privacy:** text remains in the existing IndexedDB `learningProgress` record. There is no new remote service, analytics event, account, or database migration.
- **Resilience:** a ZIP backup includes optional `reflections` fields inside the current GhostShelf v1 manifest's `learningProgress` records. Old backups and records without notes remain valid. Restore validates text lengths and step IDs before storing any data. Existing local trail progress takes precedence when restoring the same trail ID.
- **Portability:** `Download my journal` creates an **unencrypted Markdown file** on the device, only by explicit action. People should not write passwords or other highly sensitive credentials in journals.
- **Accessibility:** descriptive labels, keyboard-accessible text areas and explicit save states.

## Human Essentials Learning Trails (Rung 6)

Six optional, self-paced learning paths put the existing free Commons resources to practical use. The paths cover learning, personal finance, digital safety, communication, making things, and everyday wellbeing. Each offers three real-life exercises with an explicit link to its relevant Field Guide or publisher's page.

A person can manually mark an activity as tried. This is **self-reported progress**, not a test score, a verified skill certification, a reading tracker, a streak, or a behavioral profile. Learning progress is stored exclusively in the browser's IndexedDB. The database moves from version 1 to **version 2** with a non-destructive upgrade; original GhostShelf source blobs remain untouched.

**Portable progress:** GhostShelf ZIP backups remain **manifest version 1** for backward compatibility. New exports include an optional `learningProgress` collection. Old backup files still restore; progress from the local browser wins if the same trail exists in both places. The same atomic restore transaction handles sources, notes, receipts and newly imported learning-progress records. You can export a backup even when GhostShelf has no imported books.

## Human Essentials Field Library (Rung 5)

The app now includes a curated, searchable **Human Essentials** catalog. It is separate from the user's private GhostShelf, so simply browsing the Commons does not create entries or use personal storage.

- **8 original offline Field Guides** on learning, evidence, money basics, digital security, communication, creativity, health foundations, and household preparedness. These are new MIT-licensed PaperGhost documents, not copies of third-party publications. Select "Read offline +" to explicitly import a guide into GhostShelf, then read it through the existing local reader.
- **12 curated external resources** from OpenStax, Project Gutenberg, CFPB, FTC, and NLM/MedlinePlus. Each opens the publisher's official HTTPS source page in a new tab. The app **does not scrape, republish, fetch automatically, or silently import** content from outside sources.
- Search and filter by practical category. No remote catalog API, account, tracking, or paywall.
- To read an external book offline, get the PDF/EPUB from the publisher and manually import it into PaperGhost. The original publisher's rights and the laws of your jurisdiction still apply.

**Rights:** The PaperGhost source license does not override third-party copyrights. OpenStax describes its current textbook license as CC BY-NC-SA and also restricts ingesting content into AI offerings without permission. Project Gutenberg's US copyright status does not automatically apply internationally. Health/finance links are general education, not personalized advice. Internet is needed to open outside sources.

## CodexOS Reading Desk (Rung 2c)

- Save named bookmarks in PDF, CBZ and EPUB publications. PDF/CBZ marks use 1-based page numbers; EPUB marks use the actual CFI location reported by its rendition.
- Open or remove bookmarks from the reader's Bookmarks rail. These are saved in publication metadata in GhostShelf, not in original source files.
- Use a Go-to-page input in PDF and CBZ readers. Existing page buttons and manga directional navigation remain.
- Bookmarks are included in the same GhostShelf v1 ZIP backup format (no breaking export migration). Older backup files with no bookmarks remain readable. Manifest validation rejects invalid bookmark metadata.
- Plain text/Markdown bookmarks are deferred until those formats have reliable scroll anchors, rather than pretending to save a location.

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
