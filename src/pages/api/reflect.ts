export const prerender = false;

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env manually as fallback (Astro 6 env handling)
function loadEnvKey(): string {
  try {
    // Try import.meta.env first
    const fromMeta = (import.meta as any).env?.ANTHROPIC_API_KEY;
    if (fromMeta) return fromMeta;

    // Try process.env
    const fromProcess = process.env.ANTHROPIC_API_KEY;
    if (fromProcess) return fromProcess;

    // Manual .env parse as last resort
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf8');
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    return match?.[1]?.trim() || '';
  } catch {
    return '';
  }
}

interface ReflectRequest {
  tool: string;
  step: number;
  stepLabel: string;
  userText: string;
  previousAnswers: Record<string, string>;
  framework: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  'sim-inteiro': `You are a gentle and direct therapist. The user is using the "Hell Yes or No" tool based on Derek Sivers' concept — the idea that if it's not a clear, visceral "yes!", it's a no.

Return ONLY valid JSON (no markdown, no backticks) with:
- "insight": 1-2 sentences reflecting what they said through the lens of the framework. Name patterns, contradictions, or something they may not have noticed. Be warm but honest. Never generic.
- "themes": 2-4 keywords extracted from the user's text (core nouns/concepts)
- "visualData": { "motiveType": "genuine"|"obligation"|"fear"|"guilt"|"mixed", "bodySignal": "expansion"|"contraction"|"neutral", "clarity": 0.0-1.0 }

Respond in the same language the user writes in.`,

  'medo-na-mesa': `You are a gentle and direct therapist. The user is using the "Fear Setting" tool based on Tim Ferriss' Fear Setting — decomposing fears into concrete parts and evaluating the real cost of acting vs not acting.

Return ONLY valid JSON (no markdown, no backticks) with:
- "insight": 1-2 sentences through the lens of the framework. Name patterns, contradictions. Warm, honest. Never generic.
- "themes": 2-4 keywords from the user's text
- "visualData": { "fearIntensity": 0.0-1.0, "fearType": "practical"|"social"|"identity"|"mixed", "hasStrategy": boolean }

Respond in the same language the user writes in.`,

  'tres-futuros': `You are a gentle and direct therapist. The user is using the "3 Plausible Futures" tool based on the Odyssey Plan from Design Your Life — imagining three honest versions of their next chapter to feel which one calls for a test.

Return ONLY valid JSON (no markdown, no backticks) with:
- "insight": 1-2 sentences through the lens of the framework. Warm, honest. Never generic.
- "themes": 2-4 keywords from the text
- "visualData": { "lifeEnergy": "high"|"medium"|"low", "dominantValue": string, "testability": 0.0-1.0 }

Respond in the same language the user writes in.`,

  'bussola-interna': `You are a gentle and direct therapist. The user is using the "Inner Compass" tool based on Martha Beck (Finding Your Own North Star) — using the body as a guide to separate healthy fear from real misalignment.

Return ONLY valid JSON (no markdown, no backticks) with:
- "insight": 1-2 sentences through the lens of the framework. Warm, honest. Never generic.
- "themes": 2-4 keywords from the text
- "visualData": { "source": "head"|"body"|"both", "signal": "fear"|"misalignment"|"growth", "direction": "advance"|"retreat"|"pause" }

Respond in the same language the user writes in.`,

  'auditoria-de-energia': `You are a gentle and direct therapist. The user is using the "Energy Audit" tool (May curation) — mapping what drains and what restores energy to reorganize life around what matters.

Return ONLY valid JSON (no markdown, no backticks) with:
- "insight": 1-2 sentences through the lens of the framework. Warm, honest. Never generic.
- "themes": 2-4 keywords from the text
- "visualData": { "energyType": "drains"|"restores"|"both", "controlLevel": "high"|"medium"|"low", "balance": -1.0 to 1.0 }

Respond in the same language the user writes in.`,

  'o-que-quero-dizer': `You are a gentle and direct therapist. The user is using the "What I Really Want to Say" tool based on Nonviolent Communication (Marshall Rosenberg) — translating judgment, anger, and confusion into something clear and honest.

Return ONLY valid JSON (no markdown, no backticks) with:
- "insight": 1-2 sentences through the lens of NVC. Warm, honest. Never generic.
- "themes": 2-4 keywords from the text
- "visualData": { "layer": "judgment"|"feeling"|"need"|"request", "feelings": string[], "needs": string[] }

Respond in the same language the user writes in.`,

  'prototipos-de-futuro': `You are a gentle and direct therapist. The user is using the "Future Prototypes" tool based on Design Your Life — instead of deciding everything in your head, designing small tests to experience a life before committing.

Return ONLY valid JSON (no markdown, no backticks) with:
- "insight": 1-2 sentences through the lens of the framework. Warm, honest. Never generic.
- "themes": 2-4 keywords from the text
- "visualData": { "prototypeType": "conversation"|"experience"|"pilot", "feasibility": 0.0-1.0, "coreDesire": string }

Respond in the same language the user writes in.`,
};

export async function POST({ request }: { request: Request }) {
  const body = await request.json() as ReflectRequest;
  const { tool, step, stepLabel, userText, previousAnswers } = body;

  const apiKey = loadEnvKey();

  // If no API key, return fallback
  if (!apiKey) {
    return new Response(JSON.stringify({
      insight: null,
      themes: [],
      visualData: {},
      fallback: true,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = SYSTEM_PROMPTS[tool];
  if (!systemPrompt) {
    return new Response(JSON.stringify({ error: 'Unknown tool' }), { status: 400 });
  }

  // Build context from previous answers
  const previousContext = Object.entries(previousAnswers)
    .map(([key, val]) => `${key}: ${val}`)
    .join('\n');

  const userMessage = `Step ${step}: "${stepLabel}"

Previous answers:
${previousContext || '(none yet)'}

Current answer:
${userText}`;

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
        max_tokens: 250,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse JSON response from Claude
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Fallback on any error
    return new Response(JSON.stringify({
      insight: null,
      themes: [],
      visualData: {},
      fallback: true,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
