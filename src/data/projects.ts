export interface Project {
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  status: 'building' | 'active' | 'idea';
  areas: { name: string; color: string; active: boolean }[];
  stack: string[];
}

export const projects: Project[] = [
  {
    slug: 'personal-hub',
    number: '01',
    title: 'may.os',
    subtitle: 'A personal operating system through WhatsApp',
    description: 'An integrated system that captures life through natural WhatsApp messages - nutrition, journal, and ideas classified by AI and visualized in a personal dashboard.',
    status: 'building',
    areas: [
      { name: 'nutrition', color: 'var(--cat-action)', active: true },
      { name: 'body', color: 'var(--cat-energy)', active: false },
      { name: 'diary', color: 'var(--cat-thinking)', active: true },
      { name: 'work', color: 'var(--cat-decisions)', active: false },
      { name: 'relationships', color: 'var(--cat-relationships)', active: false },
      { name: 'intellectual', color: 'var(--cat-perspective)', active: false },
    ],
    stack: ['TypeScript', 'Astro', 'Supabase', 'Claude', 'Twilio', 'Vercel'],
  },
  {
    slug: 'decision-copilot',
    number: '02',
    title: 'Decision Copilot',
    subtitle: 'AI-guided clarity for hard decisions',
    description: 'A conversational tool that guides you through difficult decisions using psychology frameworks - somatic awareness, parts mapping, first principles, and regret minimization. Not to decide for you, but to help you think.',
    status: 'active',
    areas: [
      { name: 'feel', color: 'var(--cat-relationships)', active: true },
      { name: 'see', color: 'var(--cat-thinking)', active: true },
      { name: 'think', color: 'var(--cat-decisions)', active: true },
      { name: 'act', color: 'var(--cat-energy)', active: true },
    ],
    stack: ['TypeScript', 'Astro', 'Claude Sonnet', 'Web Speech API'],
  },
  {
    slug: 'life-explorer',
    number: '03',
    title: 'Life Explorer',
    subtitle: 'Mapping a life through therapy transcriptions and AI',
    description: 'An interactive visualization built from years of therapy notes - fed to Claude to extract themes, patterns, and connections. Six ways to explore: insights discovery, constellation graph, timeline, thematic dashboard, framework mapping, and reflective journal.',
    status: 'active',
    areas: [
      { name: 'explore', color: 'var(--cat-perspective)', active: true },
      { name: 'connect', color: 'var(--cat-relationships)', active: true },
      { name: 'reflect', color: 'var(--cat-thinking)', active: true },
      { name: 'discover', color: 'var(--cat-action)', active: true },
    ],
    stack: ['HTML', 'D3.js', 'Claude', 'localStorage'],
  },
];
