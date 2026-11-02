/**
 * Human Essentials Commons
 * Original field guides are MIT-licensed PaperGhost content.
 * External resources are LINKS ONLY. Their authors and licenses remain independent.
 */
export const COMMONS_CATEGORIES = [
  'Thinking & Learning',
  'Health & Safety',
  'Money & Work',
  'Technology & Privacy',
  'People & Community',
  'Making & Creativity',
  'Practical Living'
] as const;
export type CommonsCategory = typeof COMMONS_CATEGORIES[number];

interface BaseResource {
  id: string;
  title: string;
  category: CommonsCategory;
  description: string;
  author: string;
  rights: string;
  featured?: boolean;
}
export interface OfflineGuide extends BaseResource {
  kind: 'guide';
  content: string;
}
export interface ExternalResource extends BaseResource {
  kind: 'external';
  url: string;
  format: 'Free textbook' | 'Free resource' | 'Public-domain classic';
}
export type CommonsResource = OfflineGuide | ExternalResource;
const guide = (id: string, title: string, category: CommonsCategory, description: string, content: string): OfflineGuide => ({
  id, title, category, description, content, kind: 'guide',
  author: 'Enter the Field · PaperGhost', rights: 'Original guide · MIT license', featured: true
});
const external = (
  id: string, title: string, category: CommonsCategory, description: string,
  author: string, rights: string, format: ExternalResource['format'], url: string
): ExternalResource => ({ id, title, category, description, author, rights, format, url, kind: 'external' });

export const ORIGINAL_GUIDES: OfflineGuide[] = [
  guide('learn-anything', 'Learn Anything, One Step at a Time', 'Thinking & Learning',
    'An approachable way to practice, remember, and find out what you actually understand.',
`# Learn Anything, One Step at a Time

*Field Library 01 · Thinking & Learning*

Learning is a skill, not a personality trait. You do not need a perfect memory or a special background. Curiosity, practice, and good feedback get you a long way.

## 1. Start with a question

Write down exactly what you want to know or be able to do. Make the goal observable: **"I can make a small budget"** is clearer than **"get better with money."**

## 2. Make the task smaller

Break the topic into pieces that take 15–30 minutes. Find one solid introduction, try the idea yourself, and explain it in plain language.

## 3. Practice retrieval, not just rereading

Close the source and try to explain the idea without looking. Then reopen it and see what you missed. Mistakes show where the next practice session should begin.

## 4. Use feedback

Build something, answer a question, solve an example, or show your work to someone you trust. Feedback beats the pleasant illusion of understanding.

## 5. Return later

Review once after a day, again after several days, and again a few weeks later. Small revisits usually beat one exhausting study session.

## A practical learning loop

- [ ] Define the question.
- [ ] Find a trustworthy source and check who wrote it.
- [ ] Read or watch one short section.
- [ ] Attempt something without looking at the answer.
- [ ] Note what was confusing.
- [ ] Rest, then return.

## Be kind to your attention

Your time matters. Learning can be joyful and slow. Some days the right move is a walk, sleep, or help from another person.

*Original PaperGhost guide · MIT licensed. Not a substitute for formal professional training where safety matters.*`),

  guide('think-clearly', 'Think Clearly: Evidence, Questions & Claims', 'Thinking & Learning',
    'A calm toolkit for distinguishing what is known, plausible, and merely repeated.',
`# Think Clearly: Evidence, Questions & Claims

*Field Library 02 · Thinking & Learning*

People encounter far more claims than they can investigate. Good thinking is not having an instant opinion on every claim. It is knowing how to make a reasonable decision without pretending to certainty.

## Ask five useful questions

1. **What exactly is being claimed?** A measurable statement is easier to check than a vague promise.
2. **What would change my mind?** If no evidence counts against an idea, it may not be testable.
3. **Where does the information come from?** Look for the original research, record, or eyewitness, not just someone repeating it.
4. **What are the alternatives?** One explanation is rarely the only possible one.
5. **How confident should I be?** "Possible," "likely," and "demonstrated" are different levels.

## Common traps

A personal story can be meaningful without representing every person's experience. A strong correlation does not by itself show what caused what. A confident speaker can still be mistaken. More complicated language does not make a claim more accurate.

## A simple claim ledger

Record four lines:

- **Claim:** What the source says.
- **Evidence:** What actually supports it.
- **Limits:** What remains unknown or disputed.
- **Next check:** What would provide a stronger answer.

## Practice with something ordinary

Pick a product claim, health headline, or dramatic social post. Find two independent sources, including a primary source where possible. Note where they agree and differ.

Curiosity is not the same as gullibility. Skepticism is not the same as rejecting everything. The useful middle is **careful, revisable judgment**.

*Original PaperGhost guide · MIT licensed.*`),

  guide('money-map', 'The Everyday Money Map', 'Money & Work',
    'A simple system for bills, spending, saving, and making fewer financial surprises.',
`# The Everyday Money Map

*Field Library 03 · Money & Work*

Money is a tool for keeping choices open. The point is not perfect spreadsheets or shame about spending. It is knowing what you have, what is coming, and what matters most.

## Draw your monthly map

Write down:

- **Money in:** Take-home pay, benefits, and other dependable income.
- **Needs:** Housing, groceries, utilities, transport, medicines, and minimum required payments.
- **Flexible costs:** Entertainment, subscriptions, eating out, and irregular purchases.
- **Future needs:** Repairs, annual fees, emergencies, and important goals.

If income changes week to week, use a cautious estimate rather than the best month.

## Look for timing problems

List bills by due date, not just total amount. A month can have enough money overall but still contain a difficult week. A calendar can make the problem visible.

## Choose one next action

Check a recurring charge. Start a small emergency buffer if possible. Ask a lender about hardship options before missing a payment. Compare fees on accounts. Avoid making high-stakes decisions under pressure.

## Your ten-minute weekly check-in

- [ ] Review balances and upcoming bills.
- [ ] Notice any unfamiliar transactions.
- [ ] Check purchases against priorities without judging yourself.
- [ ] Plan for one upcoming expense.
- [ ] Make one manageable improvement.

## Know when to seek trustworthy help

For debt, credit reports, or consumer protections, start with official resources such as the Consumer Financial Protection Bureau. Beware anyone promising guaranteed debt relief or demanding urgent payment.

*Original PaperGhost guide · MIT licensed. General education, not individualized financial advice.*`),

  guide('digital-self-defense', 'Digital Self-Defense for Ordinary People', 'Technology & Privacy',
    'Protect accounts and devices using the simplest habits with the biggest payoff.',
`# Digital Self-Defense for Ordinary People

*Field Library 04 · Technology & Privacy*

You do not need to become a security engineer to reduce everyday online risks.

## Start with the essentials

**Use unique passwords.** A reputable password manager can help. Use long passphrases when you must remember one yourself.

**Turn on multi-factor authentication.** Prefer phishing-resistant passkeys or security keys where supported. An authenticator app is generally better than relying on a password alone.

**Keep software updated.** Update your browser, operating system, and security tools. Replace devices that no longer receive important fixes when feasible.

**Back up what matters.** Keep an additional copy of photographs, documents, and important work. Check that you can restore it. An untested backup is an optimistic guess.

## Learn the pause rule

Scammers often create urgency, secrecy, or fear. If a message demands immediate payment, credentials, or a remote-access session, stop. Contact the organization using a trusted address you found independently.

## Privacy without paranoia

Review app permissions. Share less personal information than a service requests if it does not need it. Lock your devices and encrypt sensitive files when appropriate.

## A short safety checklist

- [ ] Passwords are unique.
- [ ] Important accounts have a second factor or passkey.
- [ ] Recovery email and phone details are current.
- [ ] Updates are enabled.
- [ ] Important files have a verified backup.
- [ ] You know how to report a lost or compromised account.

Security is not a single product. It is a handful of repeatable habits.

*Original PaperGhost guide · MIT licensed.*`),

  guide('talk-and-listen', 'Talk, Listen, Disagree, Repair', 'People & Community',
    'Practical communication without treating other people like obstacles to optimize.',
`# Talk, Listen, Disagree, Repair

*Field Library 05 · People & Community*

Being capable includes cooperating, asking for help, maintaining boundaries, and repairing relationships when things go wrong.

## Begin with understanding

Try to restate the other person's view in a way they would recognize. Ask "Did I get that right?" before arguing with it. Listening is not agreeing.

## Make requests concrete

"I need more support" may be true but difficult to act on. "Could you handle dinner on Thursdays this month?" is a request that can receive a clear response.

## Disagree with ideas, not dignity

Describe the specific behavior or claim. Avoid turning one mistake into a verdict on someone's identity. Speak about what you observed, what it meant to you, and what you need next.

## Boundaries are useful information

A boundary says what you will or will not participate in, without requiring someone else to change. You can say no without constructing a courtroom argument.

## Repair takes action

An effective apology names the action, recognizes its impact, avoids excuses, and offers a meaningful next step. The other person still gets to decide how they feel.

## Try this conversation pattern

1. "Here's what I noticed."
2. "Here's how it affected me."
3. "What was it like from your side?"
4. "Here's what would help next time."
5. "What do we agree to try?"

Not every conflict is safe to resolve directly. For harassment, abuse, or threats, prioritize safety and qualified support.

*Original PaperGhost guide · MIT licensed.*`),

  guide('make-a-thing', 'From Idea to Finished Project', 'Making & Creativity',
    'Turn a bright idea into a small working thing someone can actually use.',
`# From Idea to Finished Project

*Field Library 06 · Making & Creativity*

Ideas are easy to multiply. Finished work requires a smaller loop: define, make, try, learn, improve.

## Define a human need

Before choosing tools, answer: **Who is this for? What should they be able to do? What would make their day easier?**

A prototype should prove one important behavior. A beautiful mockup is not the same as working software, and a complex plan is not the same as a working prototype.

## Build the smallest honest version

Write down three required features and three things you will intentionally leave for later. Start with one real input and one real output.

## Test with reality

Use the thing yourself. Then invite someone who has not watched you build it. Notice where they hesitate. Bugs, confusing instructions, and inaccessible controls are useful discoveries, not personal insults.

## Keep a changelog

Each iteration should record what changed, what passed, what failed, and what remains uncertain. Save source files and respect licenses for materials you reuse.

## A one-week project experiment

- **Day 1:** Name the need and user.
- **Day 2:** Sketch the smallest workflow.
- **Day 3–4:** Make the core behavior work.
- **Day 5:** Test failure cases.
- **Day 6:** Ask someone to try it.
- **Day 7:** Publish a clear account of what works and what doesn't.

Make something worth keeping. Then make it easier for the next person.

*Original PaperGhost guide · MIT licensed.*`),

  guide('steady-foundations', 'Steady Foundations: Sleep, Food & Movement', 'Health & Safety',
    'A judgment-free guide to looking after the human operating system.',
`# Steady Foundations: Sleep, Food & Movement

*Field Library 07 · Health & Safety*

No one functions at their best all the time. Good health habits are not proof of virtue, and a single routine does not fit every body.

## Protect sleep where you can

Consistent sleep timing and a reasonably comfortable, dark environment can help many people. Sleep needs differ. Persistent insomnia, severe daytime sleepiness, or concerns about breathing during sleep deserve a discussion with a qualified clinician.

## Feed yourself reliably

Aim for regular access to enough food and a varied range of nutrients. Enjoyment matters, too. Budget, disability, culture, and medical needs change what is practical.

## Move in ways that work for you

Walking, stretching, dancing, gardening, chair-based exercises, and physical work all count as movement. Begin gently and adapt to your abilities. A clinician can advise about activity restrictions or symptoms.

## Leave room for connection and rest

Humans benefit from social support, meaning, and unstructured time. Rest is not a productivity failure.

## A grounded check-in

- [ ] Have I eaten and had access to water?
- [ ] Have I had an opportunity to rest?
- [ ] Could a little safe movement help today?
- [ ] Is there someone I want to connect with?
- [ ] Is a health concern worth discussing with a professional?

For medical questions, use dependable sources such as MedlinePlus rather than anonymous claims or miracle cures.

*Original PaperGhost guide · MIT licensed. General information only, not medical advice.*`),

  guide('home-ready', 'Home Ready: Records & Emergency Planning', 'Practical Living',
    'Know where things are, make a simple plan, and reduce avoidable chaos.',
`# Home Ready: Records & Emergency Planning

*Field Library 08 · Practical Living*

Preparedness is not panic. It is giving your future self and the people you care about a few helpful options.

## Make a household contact sheet

Write down key people, local emergency numbers, medications or care needs you choose to record, and where important documents are kept. Protect sensitive details and share them only with trusted people.

## Plan for more than one kind of disruption

Consider a power outage, interrupted internet, local evacuation, and sudden travel. Ask which supplies and transport options are realistically available.

If animals live with you, include food, transport carriers or restraints, identification, and a place that will accommodate them.

## Keep important records organized

Maintain accessible copies of identification, insurance details, emergency contacts, property or rental information, and essential account recovery methods. Store sensitive data securely and keep a separate backup.

## Practice one small scenario

Pick a realistic "what if." How would you contact each other if the phone network failed? Who would check on someone who needs help? Which route would be safest if local officials ordered an evacuation?

## Your first practical checklist

- [ ] Know who to contact.
- [ ] Know where key documents are.
- [ ] Have basic supplies appropriate to your household.
- [ ] Make a plan that includes children, older adults, disabled people, and animals as relevant.
- [ ] Review the plan after changes in living situation.

Follow your local authorities and qualified emergency guidance when an actual emergency occurs.

*Original PaperGhost guide · MIT licensed.*`)
];

export const EXTERNAL_RESOURCES: ExternalResource[] = [
  external('college-success', 'College Success', 'Thinking & Learning',
    'Study habits, goals, navigating education and your own learning path.',
    'OpenStax', 'Free online/PDF · see publisher license (CC BY-NC-SA)', 'Free textbook',
    'https://openstax.org/books/college-success/pages/1-introduction'),
  external('writing-guide', 'Writing Guide with Handbook', 'Making & Creativity',
    'Writing clearly, working with sources, and explaining ideas to others.',
    'OpenStax', 'Free online/PDF · see publisher license (CC BY-NC-SA)', 'Free textbook',
    'https://openstax.org/books/writing-guide/pages/1-introduction'),
  external('psychology-2e', 'Psychology 2e', 'People & Community',
    'An introductory evidence-based view of thinking, behavior and relationships.',
    'OpenStax', 'Free online/PDF · see publisher license (CC BY-NC-SA)', 'Free textbook',
    'https://openstax.org/books/psychology-2e/pages/1-introduction'),
  external('contemporary-math', 'Contemporary Mathematics', 'Thinking & Learning',
    'Everyday quantitative thinking, patterns, and reasoning.',
    'OpenStax', 'Free online/PDF · see publisher license (CC BY-NC-SA)', 'Free textbook',
    'https://openstax.org/books/contemporary-mathematics/pages/1-introduction'),
  external('computer-science', 'Introduction to Computer Science', 'Technology & Privacy',
    'Computing, algorithms, systems, and responsible technology use.',
    'OpenStax', 'Free online/PDF · see publisher license (CC BY-NC-SA)', 'Free textbook',
    'https://openstax.org/books/introduction-computer-science/pages/1-introduction'),
  external('business-foundations', 'Introduction to Business 2e', 'Money & Work',
    'A broad foundation in organizations, decision making, finance and careers.',
    'OpenStax', 'Free online/PDF · see publisher license (CC BY-NC-SA)', 'Free textbook',
    'https://openstax.org/books/introduction-business-2e/pages/preface'),
  external('consumer-money', 'Financial Education Tools & Worksheets', 'Money & Work',
    'Budgeting, debt, credit reports and practical consumer money tools.',
    'Consumer Financial Protection Bureau', 'Free public resource · rights vary by linked material', 'Free resource',
    'https://www.consumerfinance.gov/consumer-tools/educator-tool/adult-financial-education/tools-and-resources/'),
  external('avoid-scams', 'How to Avoid a Scam', 'Technology & Privacy',
    'Simple red flags and practical steps before sending information or money.',
    'Federal Trade Commission', 'Free public resource · consult site terms', 'Free resource',
    'https://consumer.ftc.gov/articles/how-avoid-scam'),
  external('medlineplus', 'MedlinePlus Health Topics', 'Health & Safety',
    'Readable health, medicines and medical-test information from the US National Library of Medicine.',
    'National Library of Medicine', 'Free public health resource · individual pages may have separate rights', 'Free resource',
    'https://medlineplus.gov/'),
  external('meditations', 'Meditations', 'People & Community',
    'Classic reflections on character, responsibility, adversity and judgment.',
    'Marcus Aurelius · Project Gutenberg', 'Public domain in the USA · verify status in your country', 'Public-domain classic',
    'https://www.gutenberg.org/ebooks/2680'),
  external('walden', 'Walden & Civil Disobedience', 'Practical Living',
    'Essays about simple living, independence and conscience.',
    'Henry David Thoreau · Project Gutenberg', 'Public domain in the USA · verify status in your country', 'Public-domain classic',
    'https://www.gutenberg.org/ebooks/205'),
  external('franklin', 'Autobiography of Benjamin Franklin', 'Making & Creativity',
    'A historical account of apprenticeship, experimentation and community-building.',
    'Benjamin Franklin · Project Gutenberg', 'Public domain in the USA · verify status in your country', 'Public-domain classic',
    'https://www.gutenberg.org/ebooks/148')
];

export const COMMONS_RESOURCES: CommonsResource[] = [...ORIGINAL_GUIDES, ...EXTERNAL_RESOURCES];
export function guideFileName(id: string): string {
  return 'Field-Library-' + id + '.md';
}
export function guideFile(guide: OfflineGuide): File {
  return new File([guide.content], guideFileName(guide.id), { type: 'text/markdown' });
}
export function filterCommons(query: string, category: CommonsCategory | 'All'): CommonsResource[] {
  const needle = query.toLocaleLowerCase().trim();
  return COMMONS_RESOURCES.filter(item =>
    (category === 'All' || item.category === category) &&
    (!needle || [item.title, item.description, item.author, item.category, item.kind === 'external' ? item.format : 'Offline guide']
      .join(' ').toLocaleLowerCase().includes(needle))
  );
}
