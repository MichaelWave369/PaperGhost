import { useState } from 'react';
import { LearningTrails } from './LearningTrails';
import { WorksheetWorkbench } from './WorksheetWorkbench';
import type { Publication } from '../types';
import {
  COMMONS_CATEGORIES, COMMONS_RESOURCES, filterCommons, guideFileName
} from '../lib/commons';
import type { CommonsCategory, OfflineGuide } from '../lib/commons';

interface CommonsLibraryProps {
  publications: Publication[];
  busy: boolean;
  onAddGuide: (guide: OfflineGuide) => void;
  onOpenPublication: (id: string) => void;
}

export function CommonsLibrary({ publications, busy, onAddGuide, onOpenPublication }: CommonsLibraryProps) {
  const [category, setCategory] = useState<CommonsCategory | 'All'>('All');
  const [query, setQuery] = useState('');
  const filtered = filterCommons(query, category);
  const owned = new Map(publications.map(publication => [publication.fileName, publication.id]));

  return (
    <section id="commons-library" className="commons-section" aria-labelledby="commons-title">
      <div className="section-topline">
        <span>02 / OPEN KNOWLEDGE</span>
        <span>FIELD LIBRARY · THE HUMAN ESSENTIALS</span>
      </div>
      <div className="commons-intro">
        <div>
          <p className="eyebrow">KNOWLEDGE SHOULD BE A COMMON GOOD</p>
          <h2 id="commons-title">The Human <em>Essentials.</em></h2>
          <p className="commons-lede">A free library for being a capable, thoughtful, caring human. Practical skills, big questions, and the classics worth carrying with you.</p>
        </div>
        <div className="commons-stamp" aria-label={COMMONS_RESOURCES.length + ' curated resources'}>
          <strong>{COMMONS_RESOURCES.length}</strong>
          <span>STARTER RESOURCES</span>
          <small>NO SUBSCRIPTION · NO ACCOUNT</small>
        </div>
      </div>
      <div className="commons-explainer">
        <p><strong>Original Field Guides:</strong> select <em>Read offline</em> to add a full guide to your private GhostShelf. It remains readable in PaperGhost without internet after import.</p>
        <p><strong>Free outside resources:</strong> open the actual publisher's page. Download an EPUB or PDF from there and import it into GhostShelf if you want an offline copy. Their licenses and restrictions remain theirs.</p>
      </div>
      <LearningTrails publications={publications} busy={busy} onAddGuide={onAddGuide} onOpenPublication={onOpenPublication} />
      <WorksheetWorkbench />
      <div className="commons-controls">
        <div className="commons-categories" role="group" aria-label="Library topics">
          <button type="button" className={category === 'All' ? 'active' : ''} aria-pressed={category === 'All'} onClick={() => setCategory('All')}>All topics</button>
          {COMMONS_CATEGORIES.map(topic => (
            <button type="button" key={topic} className={category === topic ? 'active' : ''} aria-pressed={category === topic} onClick={() => setCategory(topic)}>{topic}</button>
          ))}
        </div>
        <label className="commons-search">
          <span>Search the free library</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Skills, subjects, titles…" />
        </label>
      </div>
      <p className="commons-result-count" aria-live="polite">{filtered.length} of {COMMONS_RESOURCES.length} resources</p>
      {filtered.length ? (
        <div className="commons-grid">
          {filtered.map(resource => {
            const importedId = resource.kind === 'guide' ? owned.get(guideFileName(resource.id)) : undefined;
            return (
              <article className={'commons-card' + (resource.kind === 'guide' ? ' commons-guide' : '')} key={resource.id}>
                <div className="commons-card-meta">
                  <span>{resource.category}</span>
                  <span>{resource.kind === 'guide' ? 'OFFLINE GUIDE' : resource.format.toUpperCase()}</span>
                </div>
                <div className="commons-card-symbol" aria-hidden="true">{resource.kind === 'guide' ? '✳' : '◈'}</div>
                <h3>{resource.title}</h3>
                <p className="commons-card-description">{resource.description}</p>
                <p className="commons-card-author">{resource.author}</p>
                <div className="commons-card-bottom">
                  <small>{resource.rights}</small>
                  {resource.kind === 'guide' ? (
                    importedId ? <button type="button" onClick={() => onOpenPublication(importedId)}>Open in GhostShelf ↗</button>
                      : <button type="button" disabled={busy} onClick={() => onAddGuide(resource)}>Read offline +</button>
                  ) : (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={'Open ' + resource.title + ' on ' + resource.author + ' website'}>Open free source ↗</a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : <p className="commons-no-results">No books match that search. Try a broader topic.</p>}
      <p className="commons-disclaimer">
        Catalog entries are curated pointers, not endorsements or copied publications. Links require internet; availability and rights may vary by country and provider. Medical, financial and safety resources are educational, not individual professional advice. The included Field Guides are original MIT-licensed PaperGhost material.
      </p>
    </section>
  );
}
