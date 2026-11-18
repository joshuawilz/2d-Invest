import { NextResponse } from 'next/server';

const SUPER_ADMIN = '+22892360282';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('phone');
  const userPhone = sessionCookie ? sessionCookie.value : null;

  // 1. Redirection si l'utilisateur est DÉJÀ connecté et essaie d'aller sur /register
  if (pathname === '/register' && userPhone) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. SECURITÉ ADMIN
  if (pathname.startsWith('/admin')) {
    if (userPhone !== SUPER_ADMIN) {
      return NextResponse.redirect(new URL('/register', request.url));
    }
  }

  // 3. PROTECTION DASHBOARD
  if (pathname.startsWith('/dashboard')) {
    if (!userPhone) {
      return NextResponse.redirect(new URL('/register', request.url));
    }
  }

  return NextResponse.next();
}

// Le matcher doit inclure toutes les pages sensibles + la page register pour la logique inverse
export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/register'],
};