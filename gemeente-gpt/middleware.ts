/**
 * GemeenteGPT Local — Middleware
 * Checks tokenUsedToday before /api/chat
 * Returns 429 "خلصت توكن اليوم" if exceeded
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Protect /api/chat with token check ──
  if (pathname.startsWith('/api/chat') && req.method === 'POST') {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Token check is done in the route handler itself with Prisma
    // Middleware just ensures auth is present
    return NextResponse.next();
  }

  // ── Protect all /api routes except auth ──
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.userId) {
      return NextResponse.json({ error: 'غير مصرح — يرجى تسجيل الدخول' }, { status: 401 });
    }
  }

  // ── Protect dashboard pages ──
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/settings')
  ) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/chat/:path*',
    '/api/upload/:path*',
    '/api/settings/:path*',
    '/dashboard/:path*',
    '/documents/:path*',
    '/settings/:path*',
  ],
};
