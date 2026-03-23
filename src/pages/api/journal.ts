export const prerender = false;

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

interface JournalRequest {
  text: string;
  date: string;
  existingTrackers?: string[];
  recentTones?: string[];
}

const SYSTEM_PROMPT = `You analyze energy journal entries. The person is on a self-discovery journey.

Respond in the same language the user writes in. If they write in Portuguese, respond in Portuguese. If English, respond in English.

Return ONLY valid JSON (no markdown, no backticks) with:
{
  "energy_level": number from -1.0 (completely drained) to 1.0 (buzzing with energy),
  "tone": string - the dominant tone of the day. Use EXACTLY one of these 16 tones:

  High energy + positive:
  - "fire" - creative impulse, intense motivation, body in motion (Huberman/dopamine, Ferriss)
  - "encantamento" - surprised wonder, the world larger than you thought (Shukman/ordinary awakening, mudita)
  - "joy" - laughter, lightness, celebration, full presence in pleasure (mudita, Sivers/hell yes)

  Low energy + positive:
  - "serenity" - deep calm, effortless peace, nothing needs to change (upekkha, Tift/already whole)
  - "gratitude" - gentle recognition of what exists, the softened heart (Fredrickson, Shukman)
  - "acolhimento" - tenderness, care, soft connection, caring or being cared for (metta + karuna, Tift)

  Low energy + difficult:
  - "heaviness" - deep fatigue, the lived asking for rest, not sadness (dukkha)
  - "melancholy" - soft sadness, longing, beauty of what has passed (anicca, Harris)
  - "fog" - confusion, disconnection, not knowing what you feel (avidya, Tift/unlived life)

  High energy + difficult:
  - "inquietacao" - directionless energy, anxiety, restless body (5th hindrance, Huberman/cortisol)
  - "revolt" - anger, indignation, fire that wants justice or change (dvesha)
  - "aperto" - fear, contraction, chest closed, body in protection (bhaya, Tift)

  Transition / meta-states:
  - "travessia" - between states, discomfort of growth, chrysalis (Tift/dev vs fruit, bardo)
  - "presence" - here and now, mindful attention without judgment (sati, Harris, Shukman)
  - "determination" - clarity of purpose, alignment between what matters and what you do (virya, Ferriss/80-20, Sivers)
  - "entrega" - letting go of control, accepting what is, not fighting the river (upekkha, Shukman)

  "tone_emoji": a single emoji that captures the tone,
  "themes": array of 2-4 detected themes (in the same language the user wrote in),
  "celebrations": array of strings - achievements, good things, progress mentioned (can be empty),
  "ai_reflection": 1-2 short sentences. Notice something the person may not have seen. Warm, honest, informal. Can reference recent patterns if context is available.
  "tracker_suggestions": array of { "label": string, "emoji": string, "category": "body"|"mind"|"relationships"|"soul", "reason": string } - suggest ONLY if something new and recurring appeared that the person is not tracking. Maximum 1 suggestion per entry. If nothing new appeared, return empty array.
}

Rules:
- Do not diagnose. Do not be a therapist. Be an attentive friend.
- If the person mentions something positive, celebrate genuinely.
- Energy level should reflect the text, not what you think is ideal.
- Tracker suggestions only when it truly makes sense, do not force.
- Use ONLY the 16 tones listed above, do not invent new ones.`;

export async function POST({ request }: { request: Request }) {
  const body = await request.json() as JournalRequest;
  const { text, date, existingTrackers, recentTones } = body;

  if (!text || !date) {
    return new Response(JSON.stringify({ error: 'text and date required' }), { status: 400 });
  }

  const apiKey = loadEnvKey();

  if (!apiKey) {
    return new Response(JSON.stringify({
      energy_level: null,
      tone: null,
      tone_emoji: null,
      themes: [],
      celebrations: [],
      ai_reflection: null,
      tracker_suggestions: [],
      fallback: true,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const contextParts: string[] = [];
  if (recentTones && recentTones.length > 0) {
    contextParts.push(`Recent tones: ${recentTones.join(', ')}`);
  }
  if (existingTrackers && existingTrackers.length > 0) {
    contextParts.push(`The person already tracks: ${existingTrackers.join(', ')}`);
  }

  const userMessage = `Date: ${date}
${contextParts.length > 0 ? '\nContext:\n' + contextParts.join('\n') + '\n' : ''}
Journal entry:
${text}`;

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
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    const parsed = JSON.parse(responseText);

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      energy_level: null,
      tone: null,
      tone_emoji: null,
      themes: [],
      celebrations: [],
      ai_reflection: null,
      tracker_suggestions: [],
      fallback: true,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
