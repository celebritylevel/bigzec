export type HookType = 'question' | 'bold_statement' | 'story' | 'listicle' | 'controversial' | 'how_to' | 'myth_buster' | 'counterintuitive';

export interface HookTemplate {
  type: HookType;
  template: string;
  examples: string[];
  emotionTrigger: 'curiosity' | 'shock' | 'relatability' | 'fear' | 'excitement';
}

export const hookTemplates: Record<HookType, HookTemplate> = {
  question: {
    type: 'question',
    template: "Why do [X] when you could [Y]?",
    examples: [
      "Why do 90% of startups fail when the playbook is right here?",
      "Why do we work 40-hour weeks when results matter more than hours?",
      "Why do most courses fail when mentorship works?"
    ],
    emotionTrigger: 'curiosity'
  },
  bold_statement: {
    type: 'bold_statement',
    template: "[X] is dead. Here's what replaced it.",
    examples: [
      "Cold outreach is dead. Here's what replaced it.",
      "The resume is dead. Here's what replaced it.",
      "Traditional marketing is dead. Here's what replaced it."
    ],
    emotionTrigger: 'shock'
  },
  story: {
    type: 'story',
    template: "I spent [time] doing [X]. Here's what I learned:",
    examples: [
      "I spent 10 years building startups. Here's what I learned:",
      "I spent $50K on courses. Here's what actually worked:",
      "I spent 1000 hours on LinkedIn. Here's the playbook:"
    ],
    emotionTrigger: 'relatability'
  },
  listicle: {
    type: 'listicle',
    template: "[Number] things I wish I knew about [topic]:",
    examples: [
      "7 things I wish I knew before starting my business:",
      "5 things I wish I knew about investing at 25:",
      "10 things I wish I knew about remote work:"
    ],
    emotionTrigger: 'curiosity'
  },
  controversial: {
    type: 'controversial',
    template: "Unpopular opinion: [statement]",
    examples: [
      "Unpopular opinion: Your network is NOT your net worth.",
      "Unpopular opinion: Hard work is overrated.",
      "Unpopular opinion: Most mentorship is a waste of time."
    ],
    emotionTrigger: 'shock'
  },
  how_to: {
    type: 'how_to',
    template: "How I [achieved result] in [timeframe]:",
    examples: [
      "How I grew to 100K followers in 6 months:",
      "How I replaced my 9-5 income in 90 days:",
      "How I landed my dream job without applying:"
    ],
    emotionTrigger: 'excitement'
  },
  myth_buster: {
    type: 'myth_buster',
    template: "[Common belief] is a lie. Here's the truth:",
    examples: [
      "\"Follow your passion\" is a lie. Here's the truth:",
      "The \"hustle culture\" narrative is a lie. Here's the truth:",
      "\"Work smarter not harder\" is a lie. Here's the truth:"
    ],
    emotionTrigger: 'shock'
  },
  counterintuitive: {
    type: 'counterintuitive',
    template: "The [adjective] way to [goal] is to [counter-intuitive action]:",
    examples: [
      "The fastest way to grow is to stop trying to grow.",
      "The best way to network is to stop networking.",
      "The smartest way to learn is to teach."
    ],
    emotionTrigger: 'curiosity'
  }
};

export function getHookByType(type: HookType): HookTemplate {
  return hookTemplates[type];
}

export function getRandomHook(): HookTemplate {
  const types = Object.keys(hookTemplates) as HookType[];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return hookTemplates[randomType];
}

export function getHookExample(type: HookType): string {
  const hook = hookTemplates[type];
  return hook.examples[Math.floor(Math.random() * hook.examples.length)];
}

export function getHooksByEmotion(emotion: HookTemplate['emotionTrigger']): HookTemplate[] {
  return Object.values(hookTemplates).filter(h => h.emotionTrigger === emotion);
}

export function formatHookTemplate(template: string, replacements: Record<string, string>): string {
  let result = template;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(`[${key}]`, value);
  });
  return result;
}
