// src/scripts/copilot2/routing-en.ts — English descriptions for confusion types

import type { ConfusionType } from '../copilot/routing';

export function describeTypesEN(types: ConfusionType[]): string {
  const descriptions: Record<ConfusionType, string> = {
    'fear-based': 'the fear of what might go wrong',
    'identity-split': 'different parts of you wanting different things',
    'information-gap': 'a lack of clarity about your real options',
    'paralysis': 'knowing what you want but not being able to act',
    'values-conflict': 'two things you deeply value pulling in opposite directions',
    'external-pressure': 'other people\'s expectations overriding what you really want',
  };
  return types.map(t => descriptions[t] || t).join(' and ');
}
