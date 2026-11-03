import type { LearningProgress, LearningTrail } from './trails';

export const MAX_REFLECTION_LENGTH = 3000;
export const MAX_REFLECTION_STEPS = 50;

/** Notes are opt-in, plain text and live only in the reader's own progress record. */
export function changeTrailReflection(
  trail: LearningTrail,
  current: LearningProgress | undefined,
  stepId: string,
  text: string,
  updatedAt: string
): LearningProgress {
  if (!trail.steps.some(step => step.id === stepId)) {
    throw new Error('This learning trail does not contain that step.');
  }
  if (text.length > MAX_REFLECTION_LENGTH) {
    throw new Error('Reflection is too long. Keep it under 3,000 characters.');
  }
  const reflections = { ...(current?.reflections ?? {}) };
  if (text.trim()) {
    reflections[stepId] = text.trim();
  } else {
    delete reflections[stepId];
  }
  return {
    id: trail.id,
    completedStepIds: [...(current?.completedStepIds ?? [])],
    updatedAt,
    ...(Object.keys(reflections).length ? { reflections } : {})
  };
}

/** Explicitly downloaded by the user; never posted or synchronized to a server. */
export function exportTrailJournal(trail: LearningTrail, progress?: LearningProgress): string {
  const lines = [
    '# ' + trail.title,
    '',
    'PaperGhost · Human Essentials Field Journal',
    '',
    'This is your own private, self-reported learning journal. Keep the exported file safe.',
    ''
  ];
  for (const step of trail.steps) {
    const note = progress?.reflections?.[step.id];
    if (!note?.trim()) continue;
    lines.push('## ' + step.title, '', '**Activity:** ' + step.task, '', note, '');
  }
  if (!trail.steps.some(step => !!progress?.reflections?.[step.id]?.trim())) {
    lines.push('No reflections saved yet.', '');
  }
  return lines.join('\n');
}

export function hasTrailReflections(trail: LearningTrail, progress?: LearningProgress): boolean {
  return trail.steps.some(step => !!progress?.reflections?.[step.id]?.trim());
}
