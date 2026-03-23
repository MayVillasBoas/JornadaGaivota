// Single source of truth for site navigation
// Three narrative pillars: who I am, what I build, how I think

export interface NavLink {
  href: string;
  label: string;
  description: string;
  children?: { href: string; label: string }[];
}

export const mainLinks: NavLink[] = [
  { href: '/about', label: 'who I am', description: 'background, beliefs, and what I\'m up to now' },
  {
    href: '/work',
    label: 'what I build',
    description: 'lab visualizations, projects, and tools',
    children: [
      { href: '/work', label: 'what I build' },
      { href: '/lab', label: 'lab' },
      { href: '/diario', label: 'may.os' },
      { href: '/copilot', label: 'copilot' },
      { href: '/copilot2', label: 'copilot 2.0' },
      { href: '/projects/life-explorer', label: 'life explorer' },
    ],
  },
  {
    href: '/thinking',
    label: 'how I think',
    description: 'essays, books, frameworks, and mentors',
    children: [
      { href: '/thinking', label: 'how I think' },
      { href: '/escrita', label: 'essays' },
      { href: '/referencias', label: 'mentors' },
      { href: '/books', label: 'books' },
    ],
  },
];
