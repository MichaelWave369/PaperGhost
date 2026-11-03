import { COMMONS_RESOURCES } from './commons';

export interface TrailStep {
  id: string;
  title: string;
  task: string;
  resourceId: string;
}

export interface LearningTrail {
  id: string;
  title: string;
  description: string;
  outcome: string;
  steps: readonly TrailStep[];
}

export interface LearningProgress {
  id: string;
  completedStepIds: string[];
  updatedAt: string;
  /** Optional free-text reflections keyed by step ID. Never published automatically. */
  reflections?: Record<string, string>;
}

/**
 * Field Library learning trails are self-paced, optional checklists.
 * Completion is self-reported. No tests, streaks, rewards, or activity tracking.
 */
export const LEARNING_TRAILS: readonly LearningTrail[] = [
  {
    id: 'clear-thinking',
    title: 'Learn to Learn',
    description: 'Build curiosity into a repeatable learning practice.',
    outcome: 'A small personal learning plan and a method for checking understanding.',
    steps: [
      { id: 'question', title: 'Choose one real question', task: 'Read the guide and write down one specific skill or question you want to explore.', resourceId: 'learn-anything' },
      { id: 'check-evidence', title: 'Practice evaluating a claim', task: 'Make a four-line claim ledger: claim, evidence, limits, next check.', resourceId: 'think-clearly' },
      { id: 'practice-loop', title: 'Make a study loop', task: 'Choose a short lesson, practice without looking, and schedule a later review.', resourceId: 'college-success' }
    ]
  },
  {
    id: 'money-basics',
    title: 'Get Comfortable with Money',
    description: 'Make bills, spending, and financial decisions less mysterious.',
    outcome: 'A simple monthly money map and one realistic next step.',
    steps: [
      { id: 'map', title: 'Map what comes in and goes out', task: 'Make a private list of income, essentials, flexible spending, and irregular costs.', resourceId: 'money-map' },
      { id: 'bill-calendar', title: 'Check your bill timing', task: 'Compare due dates with income dates and mark one possible tight spot.', resourceId: 'consumer-money' },
      { id: 'decision', title: 'Question a financial claim', task: 'Take a common money tip and ask what evidence, limitations, and risks it has.', resourceId: 'think-clearly' }
    ]
  },
  {
    id: 'digital-independence',
    title: 'Protect Your Digital Life',
    description: 'Reduce common account, device, and scam risks.',
    outcome: 'A personal security checklist with a practical backup plan.',
    steps: [
      { id: 'account-check', title: 'Review account protection', task: 'Check a password, second factor or passkey on one important account.', resourceId: 'digital-self-defense' },
      { id: 'scam-check', title: 'Learn the pause rule', task: 'Identify two warning signs of a suspicious message and a safer way to verify it.', resourceId: 'avoid-scams' },
      { id: 'backup-check', title: 'Make one recovery plan', task: 'Identify one important file or record and how you would recover it if your device failed.', resourceId: 'home-ready' }
    ]
  },
  {
    id: 'human-connection',
    title: 'Communicate & Cooperate',
    description: 'Practice listening, boundaries, and respectful disagreement.',
    outcome: 'A clearer request and a useful conversation practice.',
    steps: [
      { id: 'listen', title: 'Reflect before replying', task: 'Try summarizing another person’s point of view before offering your own.', resourceId: 'talk-and-listen' },
      { id: 'people', title: 'Explore a behavior concept', task: 'Read about one psychological concept and note how context affects behavior.', resourceId: 'psychology-2e' },
      { id: 'repair', title: 'Plan a constructive conversation', task: 'Write one concrete, respectful request or boundary using clear observations.', resourceId: 'talk-and-listen' }
    ]
  },
  {
    id: 'make-something',
    title: 'Make Something Useful',
    description: 'Move a small, meaningful project from idea to feedback.',
    outcome: 'A working first version, plus a short record of what you learned.',
    steps: [
      { id: 'scope', title: 'Define the smallest useful version', task: 'Name who it helps, the one thing it does, and what you will leave out.', resourceId: 'make-a-thing' },
      { id: 'explain', title: 'Write clear instructions', task: 'Explain how someone new would use your project in plain language.', resourceId: 'writing-guide' },
      { id: 'test', title: 'Get feedback and revise', task: 'Try the project with someone else or follow your own instructions as a new user; record what failed.', resourceId: 'make-a-thing' }
    ]
  },
  {
    id: 'everyday-foundations',
    title: 'Care for Everyday Life',
    description: 'Build a calm foundation for wellbeing and preparedness.',
    outcome: 'A manageable household check-in and one useful preparation.',
    steps: [
      { id: 'body', title: 'Check your basic needs', task: 'Review rest, food, movement and social connection without turning them into a score.', resourceId: 'steady-foundations' },
      { id: 'source', title: 'Find reliable health information', task: 'Explore a health topic from a credible source; note when professional guidance would matter.', resourceId: 'medlineplus' },
      { id: 'home', title: 'Prepare one small thing', task: 'Write an emergency contact or find one important record you might need later.', resourceId: 'home-ready' }
    ]
  }
];

export function trailCompletion(trail: LearningTrail, progress?: LearningProgress): { done: number; total: number } {
  const recognized = new Set(trail.steps.map(step => step.id));
  const done = new Set((progress?.completedStepIds ?? []).filter(id => recognized.has(id)));
  return { done: done.size, total: trail.steps.length };
}

export function changeTrailStep(
  trail: LearningTrail, current: LearningProgress | undefined, stepId: string,
  completed: boolean, updatedAt: string
): LearningProgress {
  if (!trail.steps.some(step => step.id === stepId)) {
    throw new Error('This learning trail does not contain that step.');
  }
  const completedStepIds = new Set(current?.completedStepIds ?? []);
  if (completed) completedStepIds.add(stepId);
  else completedStepIds.delete(stepId);
  return { ...current, id: trail.id, completedStepIds: [...completedStepIds], updatedAt };
}

export function resourceForStep(step: TrailStep) {
  return COMMONS_RESOURCES.find(item => item.id === step.resourceId);
}
