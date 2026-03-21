import { defineMiddleware } from 'astro:middleware';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth', '/api/reflect', '/api/explore', '/api/journal', '/explorar', '/lab'];

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

  // Check for session cookie
  const session = context.cookies.get('may-session')?.value;

  if (session !== 'authenticated') {
    return context.redirect('/login');
  }

  return next();
});
