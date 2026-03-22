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
    title: 'Personal Hub',
    subtitle: 'A life evolution system through WhatsApp',
    description: 'An integrated chat that connects personal journal, health tracking, and work — all through natural WhatsApp messages classified by AI into six life areas.',
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
];
