import type { Publication } from '../types';
import type { GuidePackItem } from '../lib/guidePack';
import { planGuidePack } from '../lib/guidePack';

/** Only original PaperGhost works are bundled. Third-party books remain links. */
export function OfflineEssentialsPack({
  publications, items, busy, error, message, onAddAll, onDownload
}: {
  publications: Publication[];
  items: GuidePackItem[] | null;
  busy: boolean;
  error: string;
  message: string;
  onAddAll: () => void;
  onDownload: () => void;
}) {
  const plan = items ? planGuidePack(publications, items) : null;
  const count = plan?.installed.length ?? 0;
  const total = plan?.total ?? 8;
  return (
    <section className="offline-essentials" aria-labelledby="offline-essentials-title">
      <div className="offline-essentials-copy">
        <p className="eyebrow">THE LIBRARY THAT TRAVELS WITH YOU</p>
        <h3 id="offline-essentials-title">Take the essentials offline.</h3>
        <p>Add all eight original Field Guides to your private GhostShelf in one click, or download a portable ZIP of the eight guides plus eight blank worksheets. No account or remote downloads required.</p>
        <p className="offline-essentials-rights">Only original MIT-licensed PaperGhost resources are included. External textbooks remain at their publishers. Your personal notes, drafts and reading history are <strong>never</strong> included in the starter pack.</p>
        <div className="offline-essentials-actions">
          <button type="button" className="primary-button" disabled={busy || !plan || plan.missing.length === 0}
            onClick={onAddAll}>
            {busy ? 'Working…' : !plan ? 'Checking your shelf…' : !plan.missing.length ? 'All guides are on your shelf' : 'Add ' + plan.missing.length + ' guides to GhostShelf'}
          </button>
          <button type="button" className="outline-button" disabled={busy}
            onClick={onDownload}>Download free starter ZIP</button>
        </div>
        {error ? <p className="offline-pack-error" role="alert">{error}</p> : null}
        {message ? <p className="offline-pack-message" role="status">{message}</p> : null}
      </div>
      <div className="offline-pack-meter" role="group" aria-label="Original guides stored in your private GhostShelf">
        <strong>{count}<span>/{total}</span></strong>
        <span>ORIGINAL GUIDES ON YOUR SHELF</span>
        <progress max={total} value={count} aria-label={count + ' of ' + total + ' guides available locally'} />
        <small>Local storage can be cleared by your browser. Use GhostShelf Backup ZIP to safeguard your actual library, reflections and personal worksheets. For offline access to the app itself, open/install the PWA while online first.</small>
      </div>
    </section>
  );
}
