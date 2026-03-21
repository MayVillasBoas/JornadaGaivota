// src/scripts/explore-session.ts
// In-memory session state for the exploration feature

import { getAllPrinciples, getMentorBySlug, categoryColors } from '../data/mentors';
import type { Principle, Category } from '../data/mentors';

export interface LensState {
  principleId: string;
  principle: Principle;
  personalizedInsight: string;
  relevance: number;
  mentorName: string;
  color: string;
  addedAt: number;
}

export interface Connection {
  from: string;
  to: string;
  reason: string;
}

export interface ExploreSession {
  messages: { role: 'user' | 'assistant'; content: string }[];
  lenses: Map<string, LensState>;
  connections: Connection[];
  isLoading: boolean;
}

const MAX_VISIBLE_LENSES = 10;

let session: ExploreSession = {
  messages: [],
  lenses: new Map(),
  connections: [],
  isLoading: false,
};

const principlesMap = new Map(getAllPrinciples().map(p => [p.id, p]));

export function getSession(): ExploreSession {
  return session;
}

export function setLoading(loading: boolean) {
  session.isLoading = loading;
}

export function addUserMessage(text: string) {
  session.messages.push({ role: 'user', content: text });
}

export function addAssistantMessage(content: string) {
  session.messages.push({ role: 'assistant', content });
}

export function getHistory(): { role: 'user' | 'assistant'; content: string }[] {
  return [...session.messages];
}

export function addLenses(
  lenses: { principleId: string; personalizedInsight: string; relevance: number }[],
) {
  for (const lens of lenses) {
    const principle = principlesMap.get(lens.principleId);
    if (!principle) continue;

    const mentor = getMentorBySlug(principle.mentorSlug);
    const primaryCat = principle.categories[0] as Category;

    session.lenses.set(lens.principleId, {
      principleId: lens.principleId,
      principle,
      personalizedInsight: lens.personalizedInsight,
      relevance: lens.relevance,
      mentorName: mentor?.name ?? principle.mentorSlug,
      color: categoryColors[primaryCat],
      addedAt: Date.now(),
    });
  }

  // Trim to max visible — remove oldest first
  if (session.lenses.size > MAX_VISIBLE_LENSES) {
    const sorted = [...session.lenses.entries()].sort(
      (a, b) => a[1].addedAt - b[1].addedAt,
    );
    while (session.lenses.size > MAX_VISIBLE_LENSES) {
      const oldest = sorted.shift();
      if (oldest) session.lenses.delete(oldest[0]);
    }
  }
}

export function addConnections(
  connections: { from: string; to: string; reason: string }[],
) {
  for (const conn of connections) {
    // Only add if both endpoints exist in current lenses
    if (session.lenses.has(conn.from) && session.lenses.has(conn.to)) {
      const exists = session.connections.some(
        c => c.from === conn.from && c.to === conn.to,
      );
      if (!exists) {
        session.connections.push(conn);
      }
    }
  }
}

export function getLensesArray(): LensState[] {
  return [...session.lenses.values()];
}

export function getLens(principleId: string): LensState | undefined {
  return session.lenses.get(principleId);
}

export function resetSession() {
  session = {
    messages: [],
    lenses: new Map(),
    connections: [],
    isLoading: false,
  };
}
