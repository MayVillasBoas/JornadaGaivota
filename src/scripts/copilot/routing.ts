// src/scripts/copilot/routing.ts

export type ConfusionType =
  | 'fear-based'
  | 'identity-split'
  | 'information-gap'
  | 'paralysis'
  | 'values-conflict'
  | 'external-pressure';

export interface Classification {
  types: ConfusionType[];
  confidence: number;
  reasoning: string;
}

// MVP: Routes are constrained to the 5 available modules.
// The spec defines routes using all 17 modules (Fear Setting, Inversion, 10/10/10, etc).
// These routes will be expanded as more modules are built post-MVP.
const SINGLE_TYPE_ROUTES: Record<ConfusionType, string[]> = {
  'fear-based':        ['body-scan', 'first-principles', 'regret-minimization', 'decision-memo'],
  'identity-split':    ['parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'],
  'information-gap':   ['first-principles', 'regret-minimization', 'decision-memo'],
  'paralysis':         ['body-scan', 'regret-minimization', 'decision-memo'],
  'values-conflict':   ['parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'],
  'external-pressure': ['parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'],
};

const DEFAULT_ROUTE = ['body-scan', 'first-principles', 'decision-memo'];

export function buildRoute(classification: Classification): string[] {
  const { types, confidence } = classification;

  // Low confidence or too many types → default route
  if (confidence < 0.6 || types.length === 0 || types.length > 2) {
    return DEFAULT_ROUTE;
  }

  if (types.length === 1) {
    return SINGLE_TYPE_ROUTES[types[0]] || DEFAULT_ROUTE;
  }

  // Dual-type: concatenate, deduplicate, cap at 4 + decision-memo
  const combined: string[] = [];
  for (const type of types) {
    for (const mod of (SINGLE_TYPE_ROUTES[type] || [])) {
      if (!combined.includes(mod) && mod !== 'decision-memo') {
        combined.push(mod);
      }
    }
  }
  // Cap at 4 modules before decision-memo
  const capped = combined.slice(0, 4);
  capped.push('decision-memo');
  return capped;
}

export function describeTypes(types: ConfusionType[]): string {
  const descriptions: Record<ConfusionType, string> = {
    'fear-based': 'fear of what could go wrong',
    'identity-split': 'different parts of you wanting different things',
    'information-gap': 'lack of clarity about your real options',
    'paralysis': 'knowing what you want but not being able to act',
    'values-conflict': 'two things you deeply value pulling in opposite directions',
    'external-pressure': 'other people\'s expectations overriding what you actually want',
  };
  return types.map(t => descriptions[t] || t).join(' and ');
}
