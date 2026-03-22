export interface LabViz {
  slug: string;
  name: string;
  description: string;
  category: 'fractals' | 'complexity' | 'patterns';
  thumbnail: string;
}

export interface LabCategory {
  id: 'fractals' | 'complexity' | 'patterns';
  label: string;
  page: string;
}

export const labCategories: LabCategory[] = [
  { id: 'fractals', label: 'Fractals in Nature', page: '/fractais' },
  { id: 'complexity', label: 'Notes on Complexity', page: '/complexity' },
  { id: 'patterns', label: 'Patterns', page: '/patterns' },
];

export const labVizRegistry: LabViz[] = [
  // Fractals in Nature
  {
    slug: 'fern',
    name: 'Barnsley Fern',
    description: 'Four affine transformations that build a perfect fern',
    category: 'fractals',
    thumbnail: '/lab/thumbnails/fern.png',
  },
  {
    slug: 'romanesco',
    name: 'Romanesco',
    description: 'Golden angle spirals at every scale',
    category: 'fractals',
    thumbnail: '/lab/thumbnails/romanesco.png',
  },
  {
    slug: 'lightning',
    name: 'Lightning',
    description: 'Recursive branching that splits the sky',
    category: 'fractals',
    thumbnail: '/lab/thumbnails/lightning.png',
  },
  {
    slug: 'koch',
    name: 'Koch Snowflake',
    description: 'Infinite perimeter, finite area',
    category: 'fractals',
    thumbnail: '/lab/thumbnails/koch.png',
  },
  {
    slug: 'nautilus',
    name: 'Nautilus Spiral',
    description: 'A logarithmic spiral with chambered growth',
    category: 'fractals',
    thumbnail: '/lab/thumbnails/nautilus.png',
  },

  // Notes on Complexity
  {
    slug: 'emergence',
    name: 'Emergence',
    description: 'Hundreds of agents, three rules, one flock',
    category: 'complexity',
    thumbnail: '/lab/thumbnails/emergence.png',
  },
  {
    slug: 'edge-of-chaos',
    name: 'Edge of Chaos',
    description: 'Reaction-diffusion at the boundary of order',
    category: 'complexity',
    thumbnail: '/lab/thumbnails/edge-of-chaos.png',
  },
  {
    slug: 'stigmergy',
    name: 'Self-Organization',
    description: 'Pheromone trails that build without a plan',
    category: 'complexity',
    thumbnail: '/lab/thumbnails/stigmergy.png',
  },
  {
    slug: 'scale-shift',
    name: 'Complementarity',
    description: 'Zoom in and out, perspective shifts',
    category: 'complexity',
    thumbnail: '/lab/thumbnails/scale-shift.png',
  },
  {
    slug: 'permeable',
    name: 'Permeable Boundaries',
    description: 'Soft clusters that breathe and exchange',
    category: 'complexity',
    thumbnail: '/lab/thumbnails/permeable.png',
  },

  // Patterns
  {
    slug: 'flow-field',
    name: 'Flow Field',
    description: '3,000 particles following invisible currents',
    category: 'patterns',
    thumbnail: '/lab/thumbnails/flow-field.png',
  },
  {
    slug: 'mycelium',
    name: 'Mycelium Network',
    description: 'Stochastic branching that never repeats',
    category: 'patterns',
    thumbnail: '/lab/thumbnails/mycelium.png',
  },
  {
    slug: 'phyllotaxis',
    name: 'Phyllotaxis Bloom',
    description: 'The golden angle, petal by petal',
    category: 'patterns',
    thumbnail: '/lab/thumbnails/phyllotaxis.png',
  },
  {
    slug: 'aurora',
    name: 'Particle Aurora',
    description: 'Northern lights with additive blending',
    category: 'patterns',
    thumbnail: '/lab/thumbnails/aurora.png',
  },
  {
    slug: 'clouds',
    name: 'Cloud Fractal',
    description: 'Volumetric clouds rendered in WebGL',
    category: 'patterns',
    thumbnail: '/lab/thumbnails/clouds.png',
  },
  {
    slug: 'sunrays',
    name: 'Sun Rays',
    description: 'Crepuscular rays breaking through noise',
    category: 'patterns',
    thumbnail: '/lab/thumbnails/sunrays.png',
  },
];

export function getVizzesByCategory(categoryId: string): LabViz[] {
  return labVizRegistry.filter(v => v.category === categoryId);
}
