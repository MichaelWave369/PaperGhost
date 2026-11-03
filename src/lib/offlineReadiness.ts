export type WorkerStatus = 'controlling' | 'registered' | 'missing' | 'unsupported' | 'error';
export type StorageStatus = 'persistent' | 'best-effort' | 'unsupported' | 'error';

export interface OfflineDiagnostics {
  /** navigator.onLine is a browser hint, NOT a server connectivity test. */
  onlineHint: boolean;
  worker: WorkerStatus;
  storage: StorageStatus;
  usageBytes?: number;
  quotaBytes?: number;
}

export interface StorageEstimateSummary {
  usage: string;
  quota: string;
  percentage: number | null;
}

export function prettyStorageBytes(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value) || value < 0) return 'Unknown';
  if (value < 1024) return Math.round(value) + ' B';
  if (value < 1024 ** 2) return (value / 1024).toFixed(1) + ' KiB';
  if (value < 1024 ** 3) return (value / (1024 ** 2)).toFixed(1) + ' MiB';
  return (value / (1024 ** 3)).toFixed(2) + ' GiB';
}

export function summarizeStorage(usage: number | undefined, quota: number | undefined): StorageEstimateSummary {
  const validUsage = usage !== undefined && Number.isFinite(usage) && usage >= 0;
  const validQuota = quota !== undefined && Number.isFinite(quota) && quota > 0;
  return {
    usage: prettyStorageBytes(usage),
    quota: prettyStorageBytes(quota),
    percentage: validUsage && validQuota ? Math.round(Math.min(100, usage! / quota! * 100)) : null
  };
}

export function workerExplanation(state: WorkerStatus): string {
  switch (state) {
    case 'controlling': return 'An active PaperGhost service worker controls this page. Cached files may be usable offline.';
    case 'registered': return 'A PaperGhost service worker is active, but this page is not controlled yet. Try reloading while online.';
    case 'missing': return 'No active PaperGhost service worker was found. Load the deployed app online before attempting offline use.';
    case 'unsupported': return 'This browser does not support service workers for this page.';
    case 'error': return 'The browser did not allow the service-worker check.';
  }
}

export function storageExplanation(state: StorageStatus): string {
  switch (state) {
    case 'persistent': return 'Persistent storage was granted. This lowers automatic eviction risk, but clearing site data still removes it.';
    case 'best-effort': return 'Storage is best-effort. The browser may evict local content when space is needed.';
    case 'unsupported': return 'The browser did not expose a persistent-storage status for this page.';
    case 'error': return 'The browser did not allow the persistent-storage check.';
  }
}

/** No network fetches, telemetry, storage mutations or permission prompts. */
export async function inspectOfflineBrowser(): Promise<OfflineDiagnostics> {
  const result: OfflineDiagnostics = {
    onlineHint: navigator.onLine,
    worker: 'unsupported',
    storage: 'unsupported'
  };

  if ('serviceWorker' in navigator) {
    try {
      const scope = new URL(import.meta.env.BASE_URL, window.location.origin).href;
      const registration = await navigator.serviceWorker.getRegistration(scope);
      if (registration?.active) {
        const controller = navigator.serviceWorker.controller;
        result.worker = controller?.scriptURL === registration.active.scriptURL ? 'controlling' : 'registered';
      } else {
        result.worker = 'missing';
      }
    } catch {
      result.worker = 'error';
    }
  }

  if (navigator.storage?.persisted) {
    try {
      result.storage = (await navigator.storage.persisted()) ? 'persistent' : 'best-effort';
    } catch {
      result.storage = 'error';
    }
  }
  if (navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (typeof estimate.usage === 'number' && Number.isFinite(estimate.usage)) result.usageBytes = estimate.usage;
      if (typeof estimate.quota === 'number' && Number.isFinite(estimate.quota)) result.quotaBytes = estimate.quota;
    } catch {
      // Storage estimates are optional, approximate and not required for reading.
    }
  }
  return result;
}

/** Only call from a deliberate user click. The browser can say no. */
export async function requestPersistentStorage(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null;
  return navigator.storage.persist();
}
