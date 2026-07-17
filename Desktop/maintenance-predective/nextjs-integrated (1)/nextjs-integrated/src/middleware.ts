import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/backend/lib/auth';
import {
  AUTH_COOKIE_NAME,
  LARAVEL_TOKEN_COOKIE,
  ADMIN_ONLY_PATHS,
  ELEVATED_PATHS,
} from '@/backend/lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API routes: let them through — each handler checks auth itself ──
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // ── Auth pages: accessible without a session ─────────────────────────
  // If the user already has a valid session, bounce them to the dashboard
  // so they don't land on /login or /register while already logged in.
  const AUTH_PAGES = new Set(['/login', '/register', '/forgot-password', '/reset-password']);
  if (AUTH_PAGES.has(pathname)) {
    if (token) {
      try {
        await verifyToken(token);
        return NextResponse.redirect(new URL('/', request.url));
      } catch {
        // Token invalid/expired — show the auth page normally.
      }
    }
    return NextResponse.next();
  }

  // ── All other routes: require a valid JWT ────────────────────────────
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname); // preserve destination for post-login redirect
    return NextResponse.redirect(url);
  }

  let payload: Awaited<ReturnType<typeof verifyToken>>;
  try {
    payload = await verifyToken(token);
  } catch {
    // Expired or tampered token — clear both cookies and send to login.
    const response = NextResponse.redirect(new URL('/login', request.url));
    const clear = { httpOnly: true, maxAge: 0, path: '/' };
    response.cookies.set(AUTH_COOKIE_NAME, '', clear);
    response.cookies.set(LARAVEL_TOKEN_COOKIE, '', clear);
    return response;
  }

  // ── RBAC ─────────────────────────────────────────────────────────────
  const isAdminOnly = (ADMIN_ONLY_PATHS as readonly string[]).some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isElevated = (ELEVATED_PATHS as readonly string[]).some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isAdminOnly && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  if (isElevated && payload.role !== 'admin' && payload.role !== 'operator') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ── Forward user claims to server components via request headers ──────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

// Run on every route except Next.js internals and public static files.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|images/).*)',
  ],
};
