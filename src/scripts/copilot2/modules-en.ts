// src/scripts/copilot2/modules-en.ts - English modules for Copilot 2.0

import type { ModuleDefinition } from '../copilot/modules';

export const MODULES_EN: Record<string, ModuleDefinition> = {
  'body-scan': {
    slug: 'body-scan',
    title: 'Body Scan',
    source: 'Damasio (Somatic Markers) + Polyvagal Theory',
    layer: 'feel',
    description: 'Your body knows before your mind does.',
    activity: 'I\'ll guide you to imagine each option and notice what your body feels.',
    steps: [
      {
        question: 'Close your eyes. Imagine choosing the first path you\'re considering. Stay with that image. What happens in your body?',
        guidance: 'Does something tighten? Open up? Does your breathing change? Notice your shoulders, chest, stomach, jaw.',
        placeholder: 'When I imagine this option, my body...',
      },
      {
        question: 'Now imagine the other path. Stay with it. What does your body do? Which option felt more like expansion and which more like contraction?',
        guidance: 'Expansion (relief, openness, energy) usually signals alignment. Contraction (tightness, heaviness) usually signals resistance.',
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
    activity: 'Let\'s map the inner voices pulling you in different directions.',
    steps: [
      {
        question: 'There\'s a voice inside you that wants one thing, and another pulling differently. Describe them both - what does each want? What does each fear?',
        guidance: 'Give them names if you can. "The Provider" or "The Adventurer." What is each part protecting you from?',
        placeholder: 'One part of me wants... because it fears...\nAnother part wants... because it fears...',
      },
      {
        question: 'Stepping back from both parts - like a wise mediator - what do you notice? Is there a way to honor what both truly need?',
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
    description: 'Strip away assumptions. What is actually true?',
    activity: 'Let\'s separate verifiable facts from assumptions you\'re treating as truth.',
    steps: [
      {
        question: 'Write down every belief about this situation - every "I have to," "I can\'t," "they expect me to." Then mark each one: is it a verifiable FACT or an assumption?',
        guidance: 'A fact: "My contract ends in June." An assumption: "They\'ll never hire me again." Be ruthless.',
        placeholder: 'Facts:\n\nAssumptions:',
      },
      {
        question: 'Looking only at the facts - which assumption have you been treating as fact that, if challenged, would change everything?',
        guidance: 'This is usually the hidden lever. The thing everyone "knows" but that might not be true.',
        placeholder: 'The assumption that would change everything is...',
      },
    ],
  },
  'regret-minimization': {
    slug: 'regret-minimization',
    title: 'Regret Minimization',
    source: 'Jeff Bezos',
    layer: 'think',
    description: 'Project yourself to 80 years old. Look back.',
    activity: 'Let\'s imagine which regret would weigh more decades from now.',
    steps: [
      {
        question: 'You\'re 80 years old, looking back. You chose path A and lived with it for decades. Now imagine you chose path B instead. Which regret weighs more?',
        guidance: 'Don\'t think about next month. Think about the arc of your life. Regret of having done vs. regret of not having done.',
        placeholder: 'The heavier regret would be...',
      },
      {
        question: 'What would the 80-year-old version of you say to you right now? If they could send a message back in time, what would it be?',
        guidance: 'Wisdom often lives in that distance between your present fear and your future self\'s perspective.',
        placeholder: 'My 80-year-old self would say...',
      },
    ],
  },
  'decision-memo': {
    slug: 'decision-memo',
    title: 'Decision Memo',
    source: 'Farnam Street Decision Journal',
    layer: 'act',
    description: 'Everything you discovered, compiled into clarity.',
    activity: 'Let\'s compile everything into concrete options, trade-offs, and a next step.',
    steps: [
      {
        question: 'Based on everything - body signals, inner parts, facts vs assumptions, regret - what are your REAL OPTIONS and their trade-offs?',
        guidance: 'Include the option you\'re afraid to write down. It might be the real one.',
        placeholder: 'Option 1: I gain... but give up...\nOption 2: I gain... but give up...',
      },
      {
        question: 'Now, what does your gut say? If you had to choose in 10 seconds, what would you pick? Write it before your mind argues.',
        guidance: 'This isn\'t your final answer. It\'s a signal. Trust it enough to write it down.',
        placeholder: 'My gut says...',
      },
      {
        question: 'What is the smallest next step you can take in the next 24 hours?',
        guidance: 'A conversation. An email. A walk to think. A micro-action that breaks the paralysis.',
        placeholder: 'In the next 24 hours, I will...',
      },
    ],
  },
};

export const MODULE_ORDER_EN = ['body-scan', 'parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'];
export const PICKABLE_MODULES_EN = MODULE_ORDER_EN.filter(slug => slug !== 'decision-memo');
