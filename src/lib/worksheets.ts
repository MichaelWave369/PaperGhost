import type { CommonsCategory } from './commons';

/** Original, MIT-licensed printable templates. Never third-party copyrighted worksheets. */
export interface FieldWorksheet {
  id: string;
  title: string;
  category: CommonsCategory;
  description: string;
  revision: number;
  markdown: string;
}

export interface WorksheetDraft {
  id: string;
  content: string;
  updatedAt: string;
  templateRevision: number;
}

export const MAX_WORKSHEET_CHARACTERS = 12000;
export const MAX_WORKSHEET_DRAFTS = 100;
const worksheet = (
  id: string, title: string, category: CommonsCategory,
  description: string, markdown: string
): FieldWorksheet => ({ id, title, category, description, revision: 1, markdown });

export const FIELD_WORKSHEETS: readonly FieldWorksheet[] = [
  worksheet('weekly-map', 'The Weekly Life Map', 'Practical Living',
    'One page for priorities, responsibilities, rest and a little breathing room.',
`# My Weekly Life Map
**Week of:** [date]    **What matters most this week:** [your answer]

## Three priorities
1. [A meaningful priority]
2. [Another priority]
3. [One manageable priority]

## Responsibilities and dates
- [ ] [Task and due date]
- [ ] [Task and due date]
- [ ] [Task and due date]

## People and wellbeing
- Someone I want to connect with: [optional]
- A way I can rest or recharge: [optional]
- Something enjoyable, just because: [optional]

## If the week gets complicated
- What can wait: [your answer]
- Who or what could help: [your answer]

## End-of-week reflection
- What worked?
- What should I change?
- What am I grateful for?
`),

  worksheet('money-map', 'Money & Bills Map', 'Money & Work',
    'A private, plain-language look at cash flow and bill timing, not a financial scorecard.',
`# My Money & Bills Map
**Period:** [month or dates]

**Privacy:** Avoid account numbers, card details or passwords. Keep this unencrypted file somewhere safe.

## Money coming in
- [Source and approximate amount]
- [Source and approximate amount]
- **Estimated total:** [amount]

## Essentials and due dates
| Expense | Estimate | Due date |
| --- | --- | --- |
| Housing | [amount] | [date] |
| Food | [amount] | [date] |
| Utilities | [amount] | [date] |
| Transport | [amount] | [date] |
| Other | [amount] | [date] |

## Flexible spending and irregular costs
- [Expense and estimate]
- [Future expense to plan for]

## One action this week
- [ ] [A small, achievable money task]

**If money is tight:** Which bill or service provider could I contact early to discuss options?
[Your plan]

*Educational template only. Not personal financial advice.*
`),

  worksheet('project-starter', 'One-Page Project Starter', 'Making & Creativity',
    'Turn an idea into a small real-world experiment that someone can actually use.',
`# My One-Page Project Starter
**Working name:** [project]

## Why should this exist?
The person or problem I want to help: [answer]
The useful change I hope to make: [answer]

## Smallest honest version
The one thing it must do: [answer]

### Three requirements
- [ ] [Requirement one]
- [ ] [Requirement two]
- [ ] [Requirement three]

### Deliberately out of scope
- [Something for later]
- [Something for later]

## Build and test
**First input:** [answer]    **Expected output:** [answer]
**One failure to test:** [answer]
**Who could try it:** [answer]

## After the test
- What worked: [answer]
- What confused people: [answer]
- What I will change next: [answer]

*Small, working, and honestly described beats impressive and unfinished.*
`),

  worksheet('learning-loop', 'Learn-a-Skill Planner', 'Thinking & Learning',
    'Define a skill, practice it, and check understanding without relying on rereading.',
`# My Learn-a-Skill Planner
**I want to be able to:** [specific action]

## One clear question
[What do I want to understand or do?]

## Sources
- Trustworthy introduction: [title, URL or source]
- A second perspective, when useful: [source]

## My small practice session
**When:** [date or moment]
**One thing to try without looking at the instructions:** [task]

## What I can explain now
[Explain the idea in your own words]

## What I still need to check
[Questions, errors, uncertainties]

## Follow-up
- [ ] Review tomorrow or later
- [ ] Test with a new example
- [ ] Ask for feedback

**A real sign of progress:** [What could I demonstrate?]
`),

  worksheet('claim-ledger', 'Claim & Evidence Ledger', 'Thinking & Learning',
    'A simple way to test a claim and keep confidence proportional to evidence.',
`# My Claim & Evidence Ledger
**Date:** [date]    **Topic:** [topic]

## The exact claim
[Write the claim as fairly and specifically as possible]

## Original source
[Where did it come from? Who said it?]

## Supporting evidence
[What observations, records or measurements support it?]

## Possible alternatives
[What else might explain the same observations?]

## Limitations
[What is unknown, disputed or missing?]

## What would change my mind?
[An observation, source or test that could alter my view]

## Current judgment
**Confidence:** [low / medium / high, with reasons]
**Next check:** [the best follow-up question]

*Uncertainty is useful information, not a failure.*
`),

  worksheet('digital-checkup', 'Digital Safety Checkup', 'Technology & Privacy',
    'Review important account protections and recovery habits without recording secrets.',
`# My Digital Safety Checkup
**Date:** [date]

**Important:** Never write passwords, recovery codes, security answers, or private keys in this worksheet.

## Accounts and devices
- [ ] Important accounts use unique passwords or passkeys
- [ ] Multi-factor authentication is enabled where possible
- [ ] Recovery contact methods are current
- [ ] System, browser and apps receive updates
- [ ] Screen locks protect devices

## Backups
**Something important that needs a backup:** [describe the category, not secret contents]
**Where an additional copy is kept:** [general location]
**How I would test restoring it:** [steps]

## Scam pause rule
If I receive an urgent message asking for payment or credentials, I will independently verify it by: [method]

## My one next action
- [ ] [a safe action to take]

*Use trustworthy official support resources when accounts are compromised.*
`),

  worksheet('conversation-plan', 'Conversation & Repair Planner', 'People & Community',
    'Prepare for a thoughtful conversation with observations, requests and boundaries.',
`# My Conversation & Repair Planner
**What I hope this conversation accomplishes:** [answer]

## Describe, don't diagnose
**What I observed:** [specific event or behavior]
**How it affected me:** [your experience]

## Make space for another perspective
A question I can ask without assuming the answer: [question]

## Make one clear request
Could we try: [specific, reasonable next step]

## My own boundary or commitment
What I can control or offer: [answer]

## If it becomes unproductive
A respectful way to pause: [words you could use]

## Afterward
- What did I understand better?
- What agreement, if any, was made?

*Not every conflict should be handled directly. If safety is at risk, seek trusted and qualified support.*
`),

  worksheet('home-ready', 'Household Readiness Sheet', 'Health & Safety',
    'Plan one practical response for power outages, evacuation or other interruptions.',
`# My Household Readiness Sheet
**Reviewed on:** [date]

**Privacy:** Do not put detailed medical records, identity numbers or access codes in a shared copy.

## People, animals and accessibility
- Who needs to be included in the plan: [names or roles if appropriate]
- Needs to consider (medications, mobility, animal transport, equipment): [general notes]

## If power or internet fails
- A safe way to contact or meet: [plan]
- Useful supplies to check: [list]

## If local authorities order evacuation
- Where to find reliable instructions: [local source]
- Transport and supplies to consider: [plan]
- A backup location or contact: [plan]

## Important records
- Where protected copies are stored: [general location]
- Who should know how to find them: [trusted person]

## This week's small improvement
- [ ] [one action]
- [ ] [another action]

*Follow local emergency guidance during actual incidents.*
`)
];

export function worksheetById(id: string): FieldWorksheet | undefined {
  return FIELD_WORKSHEETS.find(item => item.id === id);
}

export function initialWorksheetDraft(template: FieldWorksheet): WorksheetDraft {
  return { id: template.id, content: template.markdown, templateRevision: template.revision, updatedAt: '' };
}

export function validateWorksheetDraft(value: unknown): value is WorksheetDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && !!worksheetById(item.id) &&
    typeof item.content === 'string' && item.content.length <= MAX_WORKSHEET_CHARACTERS &&
    typeof item.updatedAt === 'string' && item.updatedAt.length <= 64 &&
    typeof item.templateRevision === 'number' &&
    Number.isSafeInteger(item.templateRevision) && item.templateRevision >= 1 && item.templateRevision <= 1000;
}

/** No data from private drafts is embedded in the distributed source catalog. */
export function makeWorksheetExport(template: FieldWorksheet, draft?: WorksheetDraft): string {
  return draft?.content ?? template.markdown;
}
