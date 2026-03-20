import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth', '/api/reflect'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname === route + '/')) {
    return next();
  }

  // Allow static assets
  if (pathname.startsWith('/_astro/') || pathname.startsWith('/favicon')) {
    return next();
  }

  // Check for auth token in cookies
  const accessToken = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;

  if (!accessToken || !refreshToken) {
    return context.redirect('/login');
  }

  // Verify the session with Supabase
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    // Clear invalid cookies
    context.cookies.delete('sb-access-token', { path: '/' });
    context.cookies.delete('sb-refresh-token', { path: '/' });
    return context.redirect('/login');
  }

  // Update cookies if tokens were refreshed
  if (data.session.access_token !== accessToken) {
    context.cookies.set('sb-access-token', data.session.access_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    context.cookies.set('sb-refresh-token', data.session.refresh_token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return next();
});
