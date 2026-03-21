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
    description: 'Your body knows before your mind does. Let\'s listen.',
    steps: [
      {
        question: 'Close your eyes for a moment. Take three deep breaths. Now — what does your body feel like right now? Where is there tension, tightness, or heaviness?',
        guidance: 'Don\'t analyze. Just notice. Shoulders, chest, stomach, jaw, hands.',
        placeholder: 'I notice tension in my...',
      },
      {
        question: 'Now imagine choosing Option A — the first path you\'re considering. Stay with that image for a moment. What happens in your body?',
        guidance: 'Does something tighten? Open? Does your breathing change? Does anything relax or constrict?',
        placeholder: 'When I imagine this option, my body...',
      },
      {
        question: 'Now imagine choosing Option B — the other path. Again, stay with it. What does your body do?',
        guidance: 'Compare honestly. Your body doesn\'t lie — it doesn\'t know how to.',
        placeholder: 'When I imagine this option, my body...',
      },
      {
        question: 'Looking at what your body told you — was there a difference between the two? Which option felt more like expansion? Which felt more like contraction?',
        guidance: 'Expansion (relief, opening, energy) often signals alignment. Contraction (tightness, heaviness, holding breath) often signals resistance or misalignment.',
        placeholder: 'The difference I noticed was...',
      },
    ],
  },
  'parts-mapping': {
    slug: 'parts-mapping',
    title: 'Parts Mapping',
    source: 'Internal Family Systems (Richard Schwartz)',
    layer: 'see',
    description: 'You\'re not confused — different parts of you want different things. Let\'s hear them all.',
    steps: [
      {
        question: 'Think about this decision. There\'s a voice inside you that wants one thing, and another that wants something different. Can you describe the first voice? What does it want? What does it say?',
        guidance: 'Give it a name if you can. "The part that wants safety" or "The ambitious one." What is its core concern?',
        placeholder: 'One part of me wants...',
      },
      {
        question: 'Now the other voice — the one pulling in a different direction. What does it want? What is it saying?',
        guidance: 'This part isn\'t wrong either. It\'s protecting something or longing for something. What?',
        placeholder: 'Another part of me wants...',
      },
      {
        question: 'What is each part afraid would happen if it didn\'t get its way? What\'s the fear underneath each one?',
        guidance: 'Parts usually protect us from something. Safety protects from failure. Ambition protects from regret. What\'s the fear driving each?',
        placeholder: 'The first part is afraid that... The second part is afraid that...',
      },
      {
        question: 'If you could step back from both parts and observe them with compassion — like a wise mediator — what do you notice? Is there a way to honor what both parts actually need?',
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
    description: 'Strip away assumptions. What\'s actually true here?',
    steps: [
      {
        question: 'Write down everything you believe about this situation — every assumption, every "I have to," every "I can\'t," every "they expect me to." All of it.',
        guidance: 'Don\'t filter. Include the dramatic ones, the practical ones, and the ones you\'re embarrassed about.',
        placeholder: 'I believe that...',
      },
      {
        question: 'Now go through each belief. Which ones are verifiable FACTS and which ones are assumptions, stories, or fears? Mark each one.',
        guidance: 'A fact: "My contract ends in June." An assumption: "They\'ll never hire me again." Be ruthless about the distinction.',
        placeholder: 'Facts: ...\nAssumptions: ...',
      },
      {
        question: 'Look at just the facts — the things that are actually, provably true. If you only had these facts and no assumptions, what would the decision look like?',
        guidance: 'This is the foundation. When you strip away the stories, what remains?',
        placeholder: 'With only the facts, the situation is...',
      },
      {
        question: 'What\'s one assumption you\'ve been treating as fact that, if challenged, would change everything about this decision?',
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
    description: 'Project yourself to 80. Look back. What would you regret?',
    steps: [
      {
        question: 'Imagine you\'re 80 years old, sitting in a quiet room, looking back at your life. You chose Option A. You lived with that choice for decades. What do you feel? Any regret?',
        guidance: 'Don\'t think about next month. Think about the arc of your life. What would 80-year-old you say?',
        placeholder: 'If I chose this path, at 80 I would feel...',
      },
      {
        question: 'Now you\'re 80, but you chose Option B instead. You lived with THAT choice for decades. What do you feel now? Any regret?',
        guidance: 'Be honest about both sides. Regret of action AND regret of inaction are both real.',
        placeholder: 'If I chose this path instead, at 80 I would feel...',
      },
      {
        question: 'Which regret feels heavier? The regret of doing it or the regret of not doing it?',
        guidance: 'Research shows people regret inaction more than action over long time horizons. But your situation is yours. What\'s true for YOU?',
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
        question: 'In one or two sentences, what is the actual decision you\'re facing? Not the backstory — the choice itself.',
        guidance: 'If you can\'t write it clearly, you\'re not ready to decide yet — and that\'s valuable information too.',
        placeholder: 'The decision I\'m facing is...',
      },
      {
        question: 'Based on everything you\'ve explored — what your body told you, what your internal parts want, what the facts actually are, what you\'d regret — what are your real options? (Not the ones others gave you. YOUR options.)',
        guidance: 'Include the option you\'re afraid to write down. It might be the real one.',
        placeholder: 'My real options are:\n1. \n2. \n3. ',
      },
      {
        question: 'For each option, what\'s the trade-off? What do you gain and what do you give up?',
        guidance: 'Every choice has a cost. Naming it honestly makes the decision lighter, not heavier.',
        placeholder: 'Option 1: I gain... but I give up...\nOption 2: I gain... but I give up...',
      },
      {
        question: 'Right now, in this moment — what does your gut say? If you had to choose in the next 10 seconds, what would you pick? Write it down before your mind starts arguing.',
        guidance: 'This isn\'t your final answer. It\'s a signal. Trust it enough to write it down.',
        placeholder: 'My gut says...',
      },
      {
        question: 'What is the smallest next step you can take in the next 24 hours that moves you toward clarity or action? Not the whole plan — just the first step.',
        guidance: 'A conversation. An email. A walk to think. One micro-action that breaks the paralysis.',
        placeholder: 'In the next 24 hours, I will...',
      },
    ],
  },
};

export const MODULE_ORDER = ['body-scan', 'parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'];
