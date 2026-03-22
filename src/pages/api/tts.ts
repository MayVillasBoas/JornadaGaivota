export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY;
  const voiceId = import.meta.env.ELEVENLABS_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'ZYjFfS3wDiO1W1wps6f4';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ElevenLabs API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.length > 5000) {
      return new Response(JSON.stringify({ error: 'Invalid text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.5,
          style: 0.3,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('ElevenLabs error:', err);
      return new Response(JSON.stringify({ error: 'TTS failed' }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    console.error('TTS proxy error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
