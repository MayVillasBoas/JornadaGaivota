// src/scripts/copilot/modules.ts

export interface ModuleStep {
  question: string;
  guidance: string;
  placeholder: string;
}

export interface ModuleDefinition {
  slug: string;
  title: string;
  source: string;
  layer: 'feel' | 'see' | 'think' | 'act';
  description: string;
  steps: ModuleStep[];
}

export const MODULES: Record<string, ModuleDefinition> = {
  'body-scan': {
    slug: 'body-scan',
    title: 'Body Scan',
    source: 'Damasio (Somatic Markers) + Polyvagal Theory',
    layer: 'feel',
    description: 'Your body knows before your mind does.',
    steps: [
      {
        question: 'Close your eyes. Imagine choosing the first path you\'re considering. Stay with that image. What happens in your body?',
        guidance: 'Does something tighten? Open? Does your breathing change? Notice shoulders, chest, stomach, jaw.',
        placeholder: 'When I imagine this option, my body...',
      },
      {
        question: 'Now imagine the other path. Stay with it. What does your body do? Which option felt more like expansion, and which more like contraction?',
        guidance: 'Expansion (relief, opening, energy) often signals alignment. Contraction (tightness, heaviness) often signals resistance.',
        placeholder: 'When I imagine this option, my body...',
      },
    ],
  },
  'parts-mapping': {
    slug: 'parts-mapping',
    title: 'Parts Mapping',
    source: 'Internal Family Systems (Richard Schwartz)',
    layer: 'see',
    description: 'Different parts of you want different things.',
    steps: [
      {
        question: 'There\'s a voice inside you that wants one thing, and another pulling differently. Describe them both — what does each want? What does each fear?',
        guidance: 'Give them names if you can. "The provider" or "The adventurer." What is each part protecting you from?',
        placeholder: 'One part of me wants... because it fears...\nAnother part wants... because it fears...',
      },
      {
        question: 'Stepping back from both parts — like a wise mediator — what do you notice? Is there a way to honor what both actually need?',
        guidance: 'You are not your parts. You are the one who can see them both. What does that perspective reveal?',
        placeholder: 'Stepping back, I notice...',
      },
    ],
  },
  'first-principles': {
    slug: 'first-principles',
    title: 'First Principles',
    source: 'Charlie Munger + Elon Musk',
    layer: 'think',
    description: 'Strip away assumptions. What\'s actually true?',
    steps: [
      {
        question: 'Write down every belief about this situation — every "I have to," "I can\'t," "they expect me to." Then mark each one: is it a verifiable FACT or an assumption?',
        guidance: 'A fact: "My contract ends in June." An assumption: "They\'ll never hire me again." Be ruthless.',
        placeholder: 'Facts:\n\nAssumptions:',
      },
      {
        question: 'Looking at just the facts — what\'s one assumption you\'ve been treating as fact that, if challenged, would change everything?',
        guidance: 'This is often the hidden lever. The one thing everyone "knows" that might not be true.',
        placeholder: 'The assumption that would change everything is...',
      },
    ],
  },
  'regret-minimization': {
    slug: 'regret-minimization',
    title: 'Regret Minimization',
    source: 'Jeff Bezos',
    layer: 'think',
    description: 'Project yourself to 80. Look back.',
    steps: [
      {
        question: 'You\'re 80 years old, looking back. You chose path A and lived with it for decades. Then imagine you chose path B instead. Which regret feels heavier?',
        guidance: 'Don\'t think about next month. Think about the arc of your life. Regret of action vs regret of inaction.',
        placeholder: 'The heavier regret would be...',
      },
      {
        question: 'What would 80-year-old you tell present-day you? If they could send one message back in time, what would it be?',
        guidance: 'Wisdom often lives in this gap between your present fear and your future self\'s perspective.',
        placeholder: '80-year-old me would say...',
      },
    ],
  },
  'decision-memo': {
    slug: 'decision-memo',
    title: 'Decision Memo',
    source: 'Farnam Street Decision Journal',
    layer: 'act',
    description: 'Everything you\'ve uncovered, compiled into clarity.',
    steps: [
      {
        question: 'Based on everything — body signals, inner parts, facts vs assumptions, regret — what are your REAL options and their trade-offs?',
        guidance: 'Include the option you\'re afraid to write down. It might be the real one.',
        placeholder: 'Option 1: I gain... but I give up...\nOption 2: I gain... but I give up...',
      },
      {
        question: 'Right now, what does your gut say? If you had to choose in 10 seconds, what would you pick? Write it before your mind argues.',
        guidance: 'This isn\'t your final answer. It\'s a signal. Trust it enough to write it down.',
        placeholder: 'My gut says...',
      },
      {
        question: 'What\'s the smallest next step you can take in the next 24 hours?',
        guidance: 'A conversation. An email. A walk to think. One micro-action that breaks the paralysis.',
        placeholder: 'In the next 24 hours, I will...',
      },
    ],
  },
};

export const MODULE_ORDER = ['body-scan', 'parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'];

// Frameworks available for user selection (excludes decision-memo which is always auto-appended)
export const PICKABLE_MODULES = MODULE_ORDER.filter(slug => slug !== 'decision-memo');
