import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Journal requires its own separate access code
  if (pathname === '/diario' || pathname === '/diario/') {
    const diarioAccess = context.cookies.get('diario-access')?.value;
    if (diarioAccess !== 'authenticated') {
      return context.redirect('/diario-gate');
    }
  }

  return next();
});
