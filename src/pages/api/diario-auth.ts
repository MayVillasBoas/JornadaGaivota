export const prerender = false;

import type { APIRoute } from 'astro';

const DIARIO_CODE = import.meta.env.DIARIO_CODE || 'Privado';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { code } = await request.json();

  if (code !== DIARIO_CODE) {
    return new Response(JSON.stringify({ error: 'Código incorreto' }), { status: 401 });
  }

  cookies.set('diario-access', 'authenticated', {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
