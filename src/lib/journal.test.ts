import { describe, expect, it } from 'vitest';
import { LEARNING_TRAILS, changeTrailStep } from './trails';
import { changeTrailReflection, exportTrailJournal, hasTrailReflections } from './journal';

describe('Field Journal', () => {
  const trail = LEARNING_TRAILS[0];
  const at = '2026-11-03T00:00:00.000Z';

  it('stores a reflection without claiming the activity was completed', () => {
    const progress = changeTrailReflection(trail, undefined, 'question', '  I want to learn the basics.  ', at);
    expect(progress.id).toBe(trail.id);
    expect(progress.completedStepIds).toEqual([]);
    expect(progress.reflections?.question).toBe('I want to learn the basics.');
    expect(hasTrailReflections(trail, progress)).toBe(true);
    expect(changeTrailStep(trail, progress, 'check-evidence', true, at).reflections?.question)
      .toBe('I want to learn the basics.');
  });

  it('edits and removes only the requested note without mutating others', () => {
    const first = changeTrailReflection(trail, undefined, 'question', 'first thought', at);
    const second = changeTrailReflection(trail, first, 'check-evidence', 'second thought', at);
    const cleared = changeTrailReflection(trail, second, 'question', ' ', at);
    expect(first.reflections).toEqual({ question: 'first thought' });
    expect(cleared.reflections).toEqual({ 'check-evidence': 'second thought' });
    expect(second.reflections?.question).toBe('first thought');
    expect(hasTrailReflections(trail, cleared)).toBe(true);
  });

  it('rejects unknown steps and oversized text', () => {
    expect(() => changeTrailReflection(trail, undefined, '../bad', 'Hi', at)).toThrow();
    expect(() => changeTrailReflection(trail, undefined, 'question', 'x'.repeat(3001), at)).toThrow('3,000');
  });

  it('generates a locally exportable journal using only saved notes', () => {
    const progress = changeTrailReflection(trail, undefined, 'question', 'My observation', at);
    const markdown = exportTrailJournal(trail, progress);
    expect(markdown).toContain('# Learn to Learn');
    expect(markdown).toContain('My observation');
    expect(markdown).toContain('Choose one real question');
    expect(markdown).not.toContain('No reflections saved yet');
    expect(exportTrailJournal(trail)).toContain('No reflections saved yet');
  });
});
