export const prerender = false;

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getAllPrinciples, getMentorBySlug, categoryLabels } from '../../data/mentors';
import type { Principle } from '../../data/mentors';

function loadEnvKey(): string {
  try {
    const fromMeta = (import.meta as any).env?.ANTHROPIC_API_KEY;
    if (fromMeta) return fromMeta;
    const fromProcess = process.env.ANTHROPIC_API_KEY;
    if (fromProcess) return fromProcess;
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf8');
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    return match?.[1]?.trim() || '';
  } catch {
    return '';
  }
}

interface ExploreRequest {
  userText: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  action?: { type: 'deepen'; principleId: string };
}

interface LensResult {
  principleId: string;
  personalizedInsight: string;
  relevance: number;
}

interface ExploreApiResponse {
  lenses: LensResult[];
  connections: { from: string; to: string; reason: string }[];
  followUp?: string;
  fallback?: boolean;
}

function buildPrinciplesCatalog(): string {
  const principles = getAllPrinciples();
  const catalog = principles.map((p: Principle) => {
    const mentor = getMentorBySlug(p.mentorSlug);
    return {
      id: p.id,
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      mentor: mentor?.name ?? p.mentorSlug,
      categories: p.categories.map(c => categoryLabels[c]),
      relatedToolSlug: p.relatedToolSlug ?? null,
    };
  });
  return JSON.stringify(catalog, null, 2);
}

const SYSTEM_PROMPT = `You are a gentle, insightful thinker who helps people explore their dilemmas using mental models from great thinkers. You are warm but honest.

Below is the complete catalog of available principles (lenses):

<principles>
${buildPrinciplesCatalog()}
</principles>

INSTRUCTIONS:
1. Analyze what the user shared — their dilemma, situation, or question
2. Select 3-5 principles from the catalog that are MOST relevant to this specific situation
3. For each selected principle, write a PERSONALIZED insight of 1-2 sentences explaining how that principle applies to the user's specific case. Never be generic.
4. Assign a relevance score of 0.0 to 1.0 for each principle (how central it is to the dilemma)
5. Identify connections between selected principles (how they complement each other in the context of the dilemma)
6. Optionally, ask a follow-up question that helps the user go deeper

For "deepen" actions: focus on the specific principle requested, deepen the explanation, and suggest 1-2 related principles.

Return ONLY valid JSON (no markdown, no backticks) in this format:
{
  "lenses": [
    {
      "principleId": "principle-id-from-catalog",
      "personalizedInsight": "personalized insight here",
      "relevance": 0.85
    }
  ],
  "connections": [
    { "from": "principleId1", "to": "principleId2", "reason": "how they connect" }
  ],
  "followUp": "optional question for the user"
}

RULES:
- Use ONLY principleIds from the catalog — never invent new ones
- Insights must be specific to the user's situation, never generic
- Higher relevance = more central to the dilemma
- Maximum 5 lenses per response
- Minimum 1 connection if there are 2+ lenses

Respond in the same language the user writes in.`;

function buildFallback(): ExploreApiResponse {
  const principles = getAllPrinciples();
  const shuffled = [...principles].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  return {
    lenses: selected.map((p, i) => ({
      principleId: p.id,
      personalizedInsight: p.shortDescription,
      relevance: 0.8 - i * 0.15,
    })),
    connections: selected.length >= 2
      ? [{ from: selected[0].id, to: selected[1].id, reason: 'Complementary perspectives' }]
      : [],
    followUp: 'What else would you like to explore about this?',
    fallback: true,
  };
}

export async function POST({ request }: { request: Request }) {
  const body = (await request.json()) as ExploreRequest;
  const { userText, history, action } = body;

  const apiKey = loadEnvKey();
  if (!apiKey) {
    return new Response(JSON.stringify(buildFallback()), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build messages array with conversation history
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];

  if (history?.length) {
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  let currentMessage = userText;
  if (action?.type === 'deepen') {
    currentMessage = `I want to go deeper on the principle "${action.principleId}". ${userText || 'Tell me more about how this principle applies to my case.'}`;
  }
  messages.push({ role: 'user', content: currentMessage });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text;
    const parsed = JSON.parse(text) as ExploreApiResponse;

    // Validate principleIds exist in catalog
    const allIds = new Set(getAllPrinciples().map(p => p.id));
    parsed.lenses = parsed.lenses.filter(l => allIds.has(l.principleId));

    if (parsed.lenses.length === 0) {
      return new Response(JSON.stringify(buildFallback()), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify(buildFallback()), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
