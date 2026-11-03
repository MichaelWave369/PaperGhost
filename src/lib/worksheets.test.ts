import { describe, expect, it } from 'vitest';
import { COMMONS_CATEGORIES } from './commons';
import { FIELD_WORKSHEETS, initialWorksheetDraft, makeWorksheetExport, validateWorksheetDraft, worksheetById } from './worksheets';

describe('Human Essentials practical worksheets', () => {
  it('ships eight original, distinct, nonempty Markdown worksheets', () => {
    expect(FIELD_WORKSHEETS).toHaveLength(8);
    expect(new Set(FIELD_WORKSHEETS.map(x => x.id)).size).toBe(FIELD_WORKSHEETS.length);
    for (const item of FIELD_WORKSHEETS) {
      expect(COMMONS_CATEGORIES).toContain(item.category);
      expect(item.markdown).toMatch(/^# /);
      expect(item.markdown.length).toBeGreaterThan(400);
      expect(worksheetById(item.id)).toEqual(item);
      expect(validateWorksheetDraft(initialWorksheetDraft(item))).toBe(true);
    }
  });
  it('does not change templates when editing/exporting', () => {
    const template = FIELD_WORKSHEETS[0];
    const draft = { ...initialWorksheetDraft(template), content: '# A private edit', updatedAt: '2026-11-03' };
    expect(makeWorksheetExport(template, draft)).toBe('# A private edit');
    expect(template.markdown).not.toBe('# A private edit');
  });
  it('rejects unknown IDs, large content and malformed restore records', () => {
    const base = initialWorksheetDraft(FIELD_WORKSHEETS[0]);
    expect(validateWorksheetDraft({ ...base, id: '../invalid' })).toBe(false);
    expect(validateWorksheetDraft({ ...base, content: 'a'.repeat(12001) })).toBe(false);
    expect(validateWorksheetDraft({ ...base, templateRevision: -1 })).toBe(false);
    expect(validateWorksheetDraft({ ...base, updatedAt: 200 })).toBe(false);
    expect(validateWorksheetDraft(null)).toBe(false);
  });
});
