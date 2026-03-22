// Single source of truth for site navigation
// Used by Nav.astro (header) and index.astro (home explore section)

export const mainLinks = [
  { href: '/unfold', label: 'explore', description: 'frameworks, mentors, and lenses for better thinking' },
  { href: '/copilot', label: 'copilot', description: 'AI-guided decision-making through structured frameworks' },
  { href: '/copilot2', label: 'copilot 2.0', description: 'immersive meditation-guided decision experience' },
  { href: '/projects', label: 'projects', description: 'what I\'m building — tools, systems, experiments' },
  { href: '/lab', label: 'lab', description: 'visualizations and complex systems' },
];

export const mayLinks = [
  { href: '/diario', label: 'may.os', description: 'personal operating system' },
  { href: '/sobre', label: 'about', description: 'who I am and what this is about' },
  { href: '/escrita', label: 'essays', description: 'reflections and fragments' },
  { href: '/books', label: 'books', description: 'highlights from my Kindle' },
  { href: '/agora', label: 'now', description: 'what I\'m thinking and building' },
];
