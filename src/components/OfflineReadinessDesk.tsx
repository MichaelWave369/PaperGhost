import { useCallback, useEffect, useState } from 'react';
import type { Publication } from '../types';
import {
  inspectOfflineBrowser, requestPersistentStorage, storageExplanation,
  summarizeStorage, workerExplanation
} from '../lib/offlineReadiness';
import type { OfflineDiagnostics } from '../lib/offlineReadiness';
import { friendlyBytes } from '../lib/utils';

interface OfflineReadinessDeskProps {
  publications: Publication[];
  busy: boolean;
  onBackup: () => void;
  onRestore: () => void;
}

export function OfflineReadinessDesk({ publications, busy, onBackup, onRestore }: OfflineReadinessDeskProps) {
  const [snapshot, setSnapshot] = useState<OfflineDiagnostics | null>(null);
  const [checking, setChecking] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      setSnapshot(await inspectOfflineBrowser());
    } catch (reason) {
      setError('Unable to check this browser: ' + String(reason));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    let live = true;
    void inspectOfflineBrowser().then(result => {
      if (live) setSnapshot(result);
    }).catch(reason => {
      if (live) setError('Unable to check offline status: ' + String(reason));
    });
    const update = () => { if (live) void refresh(); };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    navigator.serviceWorker?.addEventListener('controllerchange', update);
    return () => {
      live = false;
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      navigator.serviceWorker?.removeEventListener('controllerchange', update);
    };
  }, [refresh]);

  async function askForPersistence() {
    if (requesting || busy) return;
    setRequesting(true);
    setMessage('');
    setError('');
    try {
      const granted = await requestPersistentStorage();
      setMessage(granted === null
        ? 'Persistent storage requests are not supported in this browser.'
        : granted
          ? 'The browser granted persistent storage. Clearing site data can still remove your library.'
          : 'The browser did not grant persistent storage. Keep regular ZIP backups of your work.');
      await refresh();
    } catch (reason) {
      setError('The browser could not process the storage request: ' + String(reason));
    } finally {
      setRequesting(false);
    }
  }

  const count = publications.length;
  const totalBytes = publications.reduce((sum, item) => sum + item.size, 0);
  const storage = summarizeStorage(snapshot?.usageBytes, snapshot?.quotaBytes);
  const persistenceAvailable = typeof navigator !== 'undefined' && !!navigator.storage?.persist;

  return (
    <section id="offline-readiness" className="offline-desk" aria-labelledby="offline-desk-title">
      <div className="offline-desk-heading">
        <div>
          <p className="eyebrow">YOUR LIBRARY · YOUR DEVICE · YOUR RESPONSIBILITY</p>
          <h3 id="offline-desk-title">Offline Readiness &amp; Recovery</h3>
          <p>See what this browser reports about offline access and local storage. Then protect what you’ve kept. No account, server probe, or telemetry.</p>
        </div>
        <button type="button" className="outline-button small" disabled={checking} onClick={() => {
          setError(''); setMessage(''); void refresh();
        }}>{checking ? 'Checking…' : 'Refresh status'}</button>
      </div>

      <div className="offline-desk-grid">
        <div className="offline-desk-stat">
          <span className="offline-desk-kicker">NETWORK HINT</span>
          <strong>{!snapshot ? 'Checking…' : snapshot.onlineHint ? 'Browser says online' : 'Browser says offline'}</strong>
          <p>{snapshot?.onlineHint === false
            ? 'This browser reports no connection. Locally stored material may still be readable.'
            : 'A browser network indicator cannot prove a website or publisher is reachable.'}</p>
        </div>
        <div className="offline-desk-stat">
          <span className="offline-desk-kicker">APP SHELL</span>
          <strong>{!snapshot ? 'Checking…' : snapshot.worker === 'controlling' ? 'Service worker controls page'
            : snapshot.worker === 'registered' ? 'Service worker registered'
              : snapshot.worker === 'missing' ? 'No active worker found'
                : 'Status unavailable'}</strong>
          <p>{snapshot ? workerExplanation(snapshot.worker) : 'Checking service worker registration…'}</p>
        </div>
        <div className="offline-desk-stat">
          <span className="offline-desk-kicker">LOCAL STORAGE</span>
          <strong>{!snapshot ? 'Checking…' : snapshot.storage === 'persistent' ? 'Persistent granted'
            : snapshot.storage === 'best-effort' ? 'Best-effort storage'
              : 'Status unavailable'}</strong>
          <p>{snapshot ? storageExplanation(snapshot.storage) : 'Checking browser storage protection…'}</p>
        </div>
      </div>

      <div className="offline-desk-details">
        <div>
          <h4>Stored in this GhostShelf</h4>
          <p><strong>{count}</strong> publication{count === 1 ? '' : 's'} · <strong>{friendlyBytes(totalBytes)}</strong> of imported source files by their recorded sizes.</p>
          <p className="offline-desk-small">Estimated usage for the entire PaperGhost browser origin: <strong>{storage.usage}</strong>.
            {storage.quota !== 'Unknown' ? <> Estimated browser quota: <strong>{storage.quota}</strong>.</> : null}
            {storage.percentage !== null ? <> Approximately <strong>{storage.percentage}%</strong> of the reported quota.</> : null}
          </p>
          <p className="offline-desk-small">Storage figures are browser estimates, not a measurement of ZIP backup size or a guarantee of available space.</p>
        </div>
        <div>
          <h4>Keep a recovery copy</h4>
          <p>GhostShelf ZIP includes your original imported books, notes, bookmarks, journal reflections, worksheets and learning progress. The starter pack includes only blank first-party material.</p>
          <div className="offline-desk-actions">
            <button type="button" className="primary-button" disabled={busy} onClick={onBackup}>Backup my GhostShelf ZIP</button>
            <button type="button" className="outline-button" disabled={busy} onClick={onRestore}>Restore a GhostShelf ZIP</button>
            {persistenceAvailable && snapshot?.storage === 'best-effort' ? (
              <button type="button" className="outline-button" disabled={requesting || busy}
                onClick={() => void askForPersistence()}>
                {requesting ? 'Requesting…' : 'Ask browser to protect storage'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {error ? <p className="offline-pack-error" role="alert">{error}</p> : null}
      {message ? <p className="offline-pack-message" role="status">{message}</p> : null}
      <details className="offline-desk-instructions">
        <summary>How to test offline reading safely</summary>
        <ol>
          <li>While online, open PaperGhost in this browser and install the PWA if your browser offers that option.</li>
          <li>Import an original Field Guide and open it in the reader. Download and store your GhostShelf backup somewhere outside this browser.</li>
          <li>Disconnect from the internet, reopen PaperGhost, and try reading the local guide. Test the actual experience: worker registration alone does not prove that every app asset is cached.</li>
          <li>Reconnect before following external publishers’ links or importing web-based materials. Refresh this panel to update its browser hints.</li>
        </ol>
      </details>
      <p className="offline-desk-disclaimer">Even when persistent storage is granted, clearing site data, using private browsing, changing browsers or devices, or uninstalling can remove local files. Backups are unencrypted. Keep them in a safe place and test restore on another browser profile when practical.</p>
    </section>
  );
}
