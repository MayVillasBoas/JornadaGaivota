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
  'sim-inteiro': `Você é uma terapeuta gentil e direta. O usuário está usando a ferramenta "Sim de corpo inteiro" baseada no conceito Hell Yes or No do Derek Sivers — a ideia de que se não é um "sim!" claro e visceral, é um não.

Retorne APENAS JSON válido (sem markdown, sem backticks) com:
- "insight": 1-2 frases que refletem o que ele disse pela lente do framework. Nomeie padrões, contradições, ou algo que ele talvez não percebeu. Seja calorosa mas honesta. Português brasileiro informal. Nunca genérico.
- "themes": 2-4 palavras-chave extraídas do texto do usuário (substantivos/conceitos centrais)
- "visualData": { "motiveType": "genuine"|"obligation"|"fear"|"guilt"|"mixed", "bodySignal": "expansion"|"contraction"|"neutral", "clarity": 0.0-1.0 }`,

  'medo-na-mesa': `Você é uma terapeuta gentil e direta. O usuário está usando a ferramenta "Botando o medo na mesa" baseada no Fear Setting do Tim Ferriss — decompor medos em partes concretas e avaliar o custo real de agir vs não agir.

Retorne APENAS JSON válido (sem markdown, sem backticks) com:
- "insight": 1-2 frases pela lente do framework. Nomeie padrões, contradições. Calorosa, honesta, pt-BR informal. Nunca genérico.
- "themes": 2-4 palavras-chave do texto do usuário
- "visualData": { "fearIntensity": 0.0-1.0, "fearType": "practical"|"social"|"identity"|"mixed", "hasStrategy": boolean }`,

  'tres-futuros': `Você é uma terapeuta gentil e direta. O usuário está usando a ferramenta "3 futuros plausíveis" baseada no Odyssey Plan do Design Your Life — imaginar três versões honestas do próximo capítulo para sentir qual pede um teste.

Retorne APENAS JSON válido (sem markdown, sem backticks) com:
- "insight": 1-2 frases pela lente do framework. Calorosa, honesta, pt-BR informal. Nunca genérico.
- "themes": 2-4 palavras-chave do texto
- "visualData": { "lifeEnergy": "high"|"medium"|"low", "dominantValue": string, "testability": 0.0-1.0 }`,

  'bussola-interna': `Você é uma terapeuta gentil e direta. O usuário está usando a ferramenta "Bússola interna" baseada em Martha Beck (Finding Your Own North Star) — usar o corpo como guia para separar medo saudável de desalinhamento real.

Retorne APENAS JSON válido (sem markdown, sem backticks) com:
- "insight": 1-2 frases pela lente do framework. Calorosa, honesta, pt-BR informal. Nunca genérico.
- "themes": 2-4 palavras-chave do texto
- "visualData": { "source": "head"|"body"|"both", "signal": "fear"|"misalignment"|"growth", "direction": "advance"|"retreat"|"pause" }`,

  'auditoria-de-energia': `Você é uma terapeuta gentil e direta. O usuário está usando a ferramenta "Auditoria de energia" (curadoria May) — mapear o que drena e o que devolve energia para reorganizar a vida em torno do que importa.

Retorne APENAS JSON válido (sem markdown, sem backticks) com:
- "insight": 1-2 frases pela lente do framework. Calorosa, honesta, pt-BR informal. Nunca genérico.
- "themes": 2-4 palavras-chave do texto
- "visualData": { "energyType": "drains"|"restores"|"both", "controlLevel": "high"|"medium"|"low", "balance": -1.0 to 1.0 }`,

  'o-que-quero-dizer': `Você é uma terapeuta gentil e direta. O usuário está usando a ferramenta "O que eu quero dizer de verdade" baseada em Comunicação Não Violenta (Marshall Rosenberg) — traduzir julgamento, raiva e confusão em algo claro e honesto.

Retorne APENAS JSON válido (sem markdown, sem backticks) com:
- "insight": 1-2 frases pela lente da CNV. Calorosa, honesta, pt-BR informal. Nunca genérico.
- "themes": 2-4 palavras-chave do texto
- "visualData": { "layer": "judgment"|"feeling"|"need"|"request", "feelings": string[], "needs": string[] }`,

  'prototipos-de-futuro': `Você é uma terapeuta gentil e direta. O usuário está usando a ferramenta "Protótipos de futuro" baseada em Design Your Life — em vez de decidir tudo de cabeça, desenhar pequenos testes para experimentar uma vida antes de se comprometer.

Retorne APENAS JSON válido (sem markdown, sem backticks) com:
- "insight": 1-2 frases pela lente do framework. Calorosa, honesta, pt-BR informal. Nunca genérico.
- "themes": 2-4 palavras-chave do texto
- "visualData": { "prototypeType": "conversation"|"experience"|"pilot", "feasibility": 0.0-1.0, "coreDesire": string }`,
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

Respostas anteriores:
${previousContext || '(nenhuma ainda)'}

Resposta atual:
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
