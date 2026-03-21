import { defineMiddleware } from 'astro:middleware';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/api/auth', '/api/reflect', '/api/explore', '/api/journal', '/explorar', '/lab', '/sobre', '/agora', '/escrita', '/mentores'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Allow public routes (exact match or with trailing slash)
  if (publicRoutes.some(route => pathname === route || pathname === route + '/')) {
    return next();
  }

  // Allow subpages of public sections
  if (pathname.startsWith('/mentores/') || pathname.startsWith('/escrita/') || pathname.startsWith('/ferramentas/')) {
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
