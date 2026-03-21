import { defineMiddleware } from 'astro:middleware';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/api/auth', '/api/reflect', '/api/copilot', '/api/explore', '/api/journal', '/api/diario-auth', '/explorar', '/lab', '/sobre', '/agora', '/escrita', '/mentores', '/unfold', '/copilot', '/diario-gate', '/books'];

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

  // Journal requires its own separate access code
  if (pathname === '/diario' || pathname === '/diario/') {
    const diarioAccess = context.cookies.get('diario-access')?.value;
    if (diarioAccess !== 'authenticated') {
      return context.redirect('/diario-gate');
    }
    return next();
  }

  // Check for session cookie
  const session = context.cookies.get('may-session')?.value;

  if (session !== 'authenticated') {
    return context.redirect('/login');
  }

  return next();
});
