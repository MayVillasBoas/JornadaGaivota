// Single source of truth for site navigation
// Two doors: building at work, building in life

export interface NavLink {
  href: string;
  label: string;
  description: string;
  children?: { href: string; label: string }[];
}

export const mainLinks: NavLink[] = [
  { href: '/about', label: 'about', description: 'background, beliefs, and what I\'m up to now' },
  { href: '/building-at-work', label: 'building at work', description: 'product, AI, and navigating ambiguity in tech' },
  {
    href: '/building-in-life',
    label: 'building in life',
    description: 'frameworks, tools, essays, and mentors for better decisions',
    children: [
      { href: '/building-in-life', label: 'building in life' },
      { href: '/escrita', label: 'essays' },
      { href: '/ferramentas', label: 'tools' },
      { href: '/copilot', label: 'copilot' },
      { href: '/referencias', label: 'mentors' },
      { href: '/books', label: 'books' },
    ],
  },
  { href: '/lab', label: 'lab', description: 'mathematical visualizations and experiments' },
];
