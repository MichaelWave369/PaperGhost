import { describe, expect, it } from 'vitest';
import { COMMONS_CATEGORIES, COMMONS_RESOURCES, EXTERNAL_RESOURCES, ORIGINAL_GUIDES, filterCommons, guideFileName } from './commons';

describe('The PaperGhost Human Essentials Commons', () => {
  it('has unique curated source IDs and broad life categories', () => {
    expect(COMMONS_RESOURCES).toHaveLength(20);
    expect(new Set(COMMONS_RESOURCES.map(entry => entry.id)).size).toBe(COMMONS_RESOURCES.length);
    for (const entry of COMMONS_RESOURCES) expect(COMMONS_CATEGORIES).toContain(entry.category);
  });
  it('ships original nonempty offline Markdown guides only', () => {
    expect(ORIGINAL_GUIDES).toHaveLength(8);
    for (const guide of ORIGINAL_GUIDES) {
      expect(guide.content.startsWith('# ')).toBe(true);
      expect(guide.content.length).toBeGreaterThan(450);
      expect(guideFileName(guide.id)).toMatch(/^Field-Library-[a-z0-9-]+\.md$/);
      expect(guide.rights).toContain('MIT');
    }
  });
  it('uses official HTTPS source pages, without mirroring third-party books', () => {
    expect(EXTERNAL_RESOURCES).toHaveLength(12);
    for (const entry of EXTERNAL_RESOURCES) {
      const url = new URL(entry.url);
      expect(url.protocol).toBe('https:');
      expect(['openstax.org', 'www.gutenberg.org', 'consumer.ftc.gov', 'www.consumerfinance.gov', 'medlineplus.gov']).toContain(url.hostname);
      expect('content' in entry).toBe(false);
    }
  });
  it('filters by topic, source and free text', () => {
    expect(filterCommons('mONEY', 'All').length).toBeGreaterThan(0);
    expect(filterCommons('', 'Technology & Privacy').every(item => item.category === 'Technology & Privacy')).toBe(true);
    expect(filterCommons('nonsense-unique-string-999', 'All')).toHaveLength(0);
  });
});
