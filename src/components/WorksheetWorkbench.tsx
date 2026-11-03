import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { allWorksheetDrafts, deleteWorksheetDraft, saveWorksheetDraft } from '../lib/db';
import { FIELD_WORKSHEETS, MAX_WORKSHEET_CHARACTERS } from '../lib/worksheets';
import type { WorksheetDraft } from '../lib/worksheets';

export function WorksheetWorkbench() {
  const [saved, setSaved] = useState<Record<string, WorksheetDraft>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const active = FIELD_WORKSHEETS.find(item => item.id === selectedId);
  const original = active ? saved[active.id]?.content ?? active.markdown : '';
  const dirty = !!active && content !== original;

  useEffect(() => {
    let current = true;
    const reload = () => {
      void allWorksheetDrafts().then(items => {
        if (current) setSaved(Object.fromEntries(items.map(item => [item.id, item])));
      }).catch(reason => {
        if (current) setError('Could not load your worksheets: ' + String(reason));
      }).finally(() => {
        if (current) setLoading(false);
      });
    };
    reload();
    window.addEventListener('paperghost:restore', reload);
    return () => {
      current = false;
      window.removeEventListener('paperghost:restore', reload);
    };
  }, []);

  useEffect(() => {
    setContent(original);
  }, [selectedId, original]);

  function choose(id: string | null) {
    if (saving || loading) return;
    if (dirty && !window.confirm('Your worksheet has unsaved changes. Discard them?')) return;
    setSelectedId(id);
    setPreview(false);
    setNotice('');
    setError('');
  }

  async function save() {
    if (!active || !dirty || loading || saving) return;
    if (content.length > MAX_WORKSHEET_CHARACTERS) {
      setError('This worksheet exceeds the 12,000-character limit.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result: WorksheetDraft = {
        id: active.id, content, updatedAt: new Date().toISOString(),
        templateRevision: active.revision
      };
      await saveWorksheetDraft(result);
      setSaved(previous => ({ ...previous, [active.id]: result }));
      setNotice('Your worksheet was saved in this browser.');
    } catch (reason) {
      setError('Could not save the worksheet: ' + String(reason));
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!active || saving || loading) return;
    if (!window.confirm('Reset this worksheet to its blank original? Your current saved answers will be deleted from this browser.')) return;
    setSaving(true);
    setError('');
    try {
      await deleteWorksheetDraft(active.id);
      setSaved(previous => {
        const next = { ...previous };
        delete next[active.id];
        return next;
      });
      setContent(active.markdown);
      setNotice('Worksheet reset to the original blank template.');
    } catch (reason) {
      setError('Could not reset the worksheet: ' + String(reason));
    } finally { setSaving(false); }
  }

  function download() {
    if (!active) return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'PaperGhost-Worksheet-' + active.id + '.md';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    setNotice(dirty ? 'Downloaded the current worksheet, including changes not yet saved in GhostShelf.' : 'Downloaded this worksheet as Markdown.');
  }

  return (
    <section className="worksheet-workbench" aria-labelledby="worksheet-workbench-heading">
      <div className="worksheet-workbench-heading">
        <div>
          <p className="eyebrow">FREE TO USE · YOUR WORK STAYS YOURS</p>
          <h3 id="worksheet-workbench-heading">The Human Essentials Workbench.</h3>
          <p>Eight practical worksheets you can fill out, print and take with you. No account. No tracking. No pretending that getting organized has to be complicated.</p>
        </div>
        <span className="worksheet-count" aria-hidden="true">08 / TOOLS</span>
      </div>
      {error ? <p className="message error" role="alert">{error}</p> : null}
      {notice ? <p className="message notice" role="status">{notice}</p> : null}
      <div className="worksheet-picker" role="group" aria-label="Choose a free worksheet">
        {FIELD_WORKSHEETS.map((template, index) => (
          <button type="button" className={'worksheet-tile' + (selectedId === template.id ? ' worksheet-selected' : '')}
            key={template.id} disabled={saving || loading} aria-pressed={selectedId === template.id}
            onClick={() => choose(selectedId === template.id ? null : template.id)}>
            <span>{String(index + 1).padStart(2, '0')} · {template.category}</span>
            <strong>{template.title}</strong>
            <small>{template.description}</small>
            <em>{saved[template.id] ? 'Saved on your device' : 'Blank starter template'}</em>
          </button>
        ))}
      </div>
      {loading ? <p className="loading">Opening the local workbench…</p> : null}
      {active && !loading ? (
        <div className="worksheet-editor-shell">
          <div className="worksheet-editor-header">
            <div>
              <p className="eyebrow">MY PRIVATE WORKSHEET</p>
              <h4>{active.title}</h4>
              <p>Change the bracketed prompts into your own answers. Saving and downloading are separate actions.</p>
            </div>
            <button type="button" className="worksheet-close" onClick={() => choose(null)}>Close ×</button>
          </div>
          <div className="worksheet-toolbar">
            <button type="button" disabled={saving} aria-pressed={!preview}
              onClick={() => setPreview(false)}>Edit</button>
            <button type="button" disabled={saving} aria-pressed={preview}
              onClick={() => setPreview(true)}>Preview / Print</button>
            <span aria-live="polite">{dirty ? 'Unsaved changes' : saved[active.id] ? 'Saved locally' : 'Original blank worksheet'}</span>
          </div>
          {preview ? (
            <div className="worksheet-paper" aria-label="Printable worksheet preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{content}</ReactMarkdown>
            </div>
          ) : (
            <label className="worksheet-text-editor">
              <span>Worksheet contents (Markdown text)</span>
              <textarea value={content} maxLength={MAX_WORKSHEET_CHARACTERS} disabled={saving}
                rows={20} onChange={event => { setContent(event.target.value); setNotice(''); }}
                spellCheck={true} />
            </label>
          )}
          <div className="worksheet-editor-actions">
            <button type="button" className="worksheet-save" onClick={() => void save()} disabled={saving || !dirty}>Save locally</button>
            <button type="button" onClick={download} disabled={saving}>Download .md</button>
            {preview ? <button type="button" onClick={() => window.print()}>Print preview</button> : null}
            <button type="button" className="worksheet-reset" onClick={() => void reset()} disabled={saving}>Reset to blank</button>
          </div>
          <p className="worksheet-privacy">
            Stored only in this browser, included in GhostShelf ZIP backups, and never uploaded by PaperGhost.
            Markdown and ZIP files are unencrypted. Avoid account credentials, identity numbers and other secrets.
            Print preview uses your browser’s print dialog.
          </p>
        </div>
      ) : null}
      <p className="worksheet-note">All templates are original PaperGhost materials under the MIT license. They are practical prompts, not professional medical, legal or financial advice.</p>
    </section>
  );
}
