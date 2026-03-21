export const prerender = false;

import type { APIRoute } from 'astro';

const ACCESS_CODE = import.meta.env.ACCESS_CODE || 'Amigos';

// Login: validate access code and set session cookie
export const POST: APIRoute = async ({ request, cookies }) => {
  const { code } = await request.json();

  if (code !== ACCESS_CODE) {
    return new Response(JSON.stringify({ error: 'Código incorreto' }), { status: 401 });
  }

  cookies.set('may-session', 'authenticated', {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

// Logout: clear session cookie
export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete('may-session', { path: '/' });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
