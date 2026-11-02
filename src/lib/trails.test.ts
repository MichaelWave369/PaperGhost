import { describe, expect, it } from 'vitest';
import { LEARNING_TRAILS, changeTrailStep, resourceForStep, trailCompletion } from './trails';
import { COMMONS_RESOURCES } from './commons';

describe('Human Essentials learning trails', () => {
  it('has distinct trails and distinct steps with working source references', () => {
    expect(LEARNING_TRAILS.length).toBe(6);
    expect(new Set(LEARNING_TRAILS.map(trail => trail.id)).size).toBe(LEARNING_TRAILS.length);
    for (const trail of LEARNING_TRAILS) {
      expect(trail.steps.length).toBeGreaterThanOrEqual(3);
      expect(new Set(trail.steps.map(step => step.id)).size).toBe(trail.steps.length);
      expect(trail.title.trim().length).toBeGreaterThan(3);
      expect(trail.outcome.trim()).not.toBe('');
      for (const step of trail.steps) {
        expect(step.task.length).toBeGreaterThan(30);
        expect(resourceForStep(step)).toBeDefined();
        expect(COMMONS_RESOURCES.some(resource => resource.id === step.resourceId)).toBe(true);
      }
    }
  });

  it('tracks opt-in progress without mutating its source or claiming a read is completion', () => {
    const trail = LEARNING_TRAILS[0];
    const now = '2026-11-02T21:00:00.000Z';
    const empty = trailCompletion(trail);
    expect(empty).toEqual({ done: 0, total: 3 });
    const first = changeTrailStep(trail, undefined, trail.steps[0].id, true, now);
    expect(first.completedStepIds).toEqual([trail.steps[0].id]);
    expect(trailCompletion(trail, first)).toEqual({ done: 1, total: 3 });
    const unmarked = changeTrailStep(trail, first, trail.steps[0].id, false, now);
    expect(unmarked.completedStepIds).toEqual([]);
    expect(first.completedStepIds).toHaveLength(1);
    expect(() => changeTrailStep(trail, first, 'invalid-step', true, now)).toThrow();
  });

  it('ignores unknown future step IDs in displayed progress', () => {
    const trail = LEARNING_TRAILS[1];
    const progress = { id: trail.id, completedStepIds: ['a-future-step', trail.steps[0].id], updatedAt: '' };
    expect(trailCompletion(trail, progress).done).toBe(1);
  });
});
