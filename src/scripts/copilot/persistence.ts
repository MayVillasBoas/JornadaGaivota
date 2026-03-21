// src/scripts/copilot/persistence.ts

import type { Classification } from './routing';

export interface JourneyData {
  id: string;
  situation: string;
  intakeAnswers: string[];
  classification: Classification | null;
  route: string[];
  currentModuleIndex: number;
  currentStepIndex: number;
  moduleResponses: Record<string, string[]>;
  moduleInsights: Record<string, string[]>;
  moduleSummaries: Record<string, string>;
  memo: MemoData | null;
  status: 'intake' | 'classifying' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface MemoData {
  situation: string;
  classification: string;
  bodyInsights: string;
  identityInsights: string;
  rationalInsights: string;
  options: string;
  tradeoffs: string;
  gutFeeling: string;
  nextStep: string;
  openQuestions: string;
  generatedAt: string;
}

const STORAGE_KEY = 'may-copilot-journeys';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function createJourney(): JourneyData {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    situation: '',
    intakeAnswers: [],
    classification: null,
    route: [],
    currentModuleIndex: 0,
    currentStepIndex: 0,
    moduleResponses: {},
    moduleInsights: {},
    moduleSummaries: {},
    memo: null,
    status: 'intake',
    createdAt: now,
    updatedAt: now,
  };
}

export function saveJourney(journey: JourneyData): void {
  journey.updatedAt = new Date().toISOString();
  const all = loadAllJourneys();
  const idx = all.findIndex(j => j.id === journey.id);
  if (idx >= 0) {
    all[idx] = journey;
  } else {
    all.push(journey);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function loadAllJourneys(): JourneyData[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function loadActiveJourney(): JourneyData | null {
  const all = loadAllJourneys();
  return all.find(j => j.status !== 'completed') || null;
}

export function loadJourney(id: string): JourneyData | null {
  const all = loadAllJourneys();
  return all.find(j => j.id === id) || null;
}
