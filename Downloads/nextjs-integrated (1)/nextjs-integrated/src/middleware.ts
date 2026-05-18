import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/backend/lib/auth';
import { AUTH_COOKIE_NAME, ADMIN_ONLY_PATHS } from '@/backend/lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API routes: let them through — each handler checks auth itself ──
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // ── /login: redirect to dashboard if user already has a valid session ──
  if (pathname === '/login') {
    if (token) {
      try {
        await verifyToken(token);
        return NextResponse.redirect(new URL('/', request.url));
      } catch {
        // Token is invalid or expired — show the login page as normal.
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
    // Expired or tampered token — clear cookie and send to login.
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });
    return response;
  }

  // ── RBAC: admin-only pages ────────────────────────────────────────────
  const isAdminOnly = (ADMIN_ONLY_PATHS as readonly string[]).some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isAdminOnly && payload.role !== 'admin') {
    // Non-admin tried to access an admin page → back to dashboard.
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
