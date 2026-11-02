import { useEffect, useState } from 'react';
import type { Publication } from '../types';
import type { OfflineGuide } from '../lib/commons';
import { guideFileName } from '../lib/commons';
import { allLearningProgress, saveLearningProgress } from '../lib/db';
import type { LearningProgress, LearningTrail } from '../lib/trails';
import {
  LEARNING_TRAILS, changeTrailStep, resourceForStep, trailCompletion
} from '../lib/trails';

interface LearningTrailsProps {
  publications: Publication[];
  busy: boolean;
  onAddGuide: (guide: OfflineGuide) => void;
  onOpenPublication: (id: string) => void;
}

export function LearningTrails({ publications, busy, onAddGuide, onOpenPublication }: LearningTrailsProps) {
  const [progress, setProgress] = useState<Record<string, LearningProgress>>({});
  const [activeTrail, setActiveTrail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const owned = new Map(publications.map(publication => [publication.fileName, publication.id]));

  useEffect(() => {
    let active = true;
    void allLearningProgress().then(items => {
      if (active) setProgress(Object.fromEntries(items.map(item => [item.id, item])));
    }).catch(reason => {
      if (active) setError('Could not load learning progress: ' + String(reason));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function toggleStep(trail: LearningTrail, stepId: string, checked: boolean) {
    if (saving || loading || error) return;
    setSaving(true);
    try {
      const next = changeTrailStep(trail, progress[trail.id], stepId, checked, new Date().toISOString());
      await saveLearningProgress(next);
      setProgress(previous => ({ ...previous, [trail.id]: next }));
    } catch (reason) {
      setError('Could not save learning progress: ' + String(reason));
    } finally {
      setSaving(false);
    }
  }

  const selected = LEARNING_TRAILS.find(trail => trail.id === activeTrail);

  return (
    <section className="learning-trails" aria-labelledby="learning-trails-title">
      <div className="learning-trails-header">
        <div>
          <p className="eyebrow">PRACTICE, NOT JUST READING</p>
          <h3 id="learning-trails-title">Choose a learning trail.</h3>
          <p>Six small, self-paced paths through the Commons. Each offers a few real-world exercises and the reading to support them. No grades, no streaks, and no account.</p>
        </div>
        <div className="trail-seal" aria-hidden="true">✳</div>
      </div>
      {error ? <div className="message error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss progress warning">×</button></div> : null}
      <div className="trail-cards">
        {LEARNING_TRAILS.map(trail => {
          const { done, total } = trailCompletion(trail, progress[trail.id]);
          const expanded = activeTrail === trail.id;
          return (
            <article className={'trail-card' + (expanded ? ' trail-card-active' : '')} key={trail.id}>
              <span className="trail-label">FIELD TRAIL · {String(LEARNING_TRAILS.indexOf(trail) + 1).padStart(2, '0')}</span>
              <h4>{trail.title}</h4>
              <p>{trail.description}</p>
              <progress max={total} value={done} aria-label={trail.title + ' progress'} />
              <div className="trail-card-bottom">
                <span>{loading ? 'Loading…' : done + ' / ' + total + ' completed'}</span>
                <button type="button" aria-expanded={expanded} aria-controls="learning-trail-detail" onClick={() => setActiveTrail(expanded ? null : trail.id)}>
                  {expanded ? 'Close trail ↑' : done ? 'Continue →' : 'Explore trail →'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {selected ? (
        <div className="trail-detail" id="learning-trail-detail">
          <div className="trail-detail-top">
            <div>
              <p className="eyebrow">A PATH YOU CAN TAKE AT YOUR OWN PACE</p>
              <h4>{selected.title}</h4>
              <p><strong>Goal:</strong> {selected.outcome}</p>
            </div>
            <button type="button" onClick={() => setActiveTrail(null)} aria-label="Close learning trail">Close ×</button>
          </div>
          <ol className="trail-step-list">
            {selected.steps.map((step, index) => {
              const finished = (progress[selected.id]?.completedStepIds ?? []).includes(step.id);
              const resource = resourceForStep(step);
              const importedId = resource?.kind === 'guide' ? owned.get(guideFileName(resource.id)) : undefined;
              return (
                <li key={step.id} className={finished ? 'trail-step-finished' : ''}>
                  <span className="trail-step-number">{String(index + 1).padStart(2, '0')}</span>
                  <div className="trail-step-info">
                    <h5>{step.title}</h5>
                    <p>{step.task}</p>
                    {resource?.kind === 'guide' ? (
                      importedId ?
                        <button type="button" className="trail-resource-button" onClick={() => onOpenPublication(importedId)}>Read: {resource.title} ↗</button> :
                        <button type="button" className="trail-resource-button" disabled={busy} onClick={() => onAddGuide(resource)}>Add and read: {resource.title} ↗</button>
                    ) : resource?.kind === 'external' ? (
                      <a className="trail-resource-button" href={resource.url} target="_blank" rel="noopener noreferrer">Open publisher: {resource.title} ↗</a>
                    ) : <p>Referenced source is not available in this edition.</p>}
                  </div>
                  <label className="trail-step-check">
                    <input type="checkbox" checked={finished} disabled={saving || loading || !!error}
                      onChange={event => void toggleStep(selected, step.id, event.target.checked)} />
                    <span>I've tried this</span>
                  </label>
                </li>
              );
            })}
          </ol>
          <p className="trail-detail-note">Checking a step is your own reflection, not proof of a test score or automatic reading history. Saved locally and included in your GhostShelf ZIP backup.</p>
        </div>
      ) : null}
      <p className="trail-privacy">Your progress stays in this browser. No telemetry, logins, rankings, or pressure. Back up GhostShelf to keep your progress when moving devices.</p>
    </section>
  );
}
