import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, LARAVEL_TOKEN_COOKIE } from '@/backend/lib/constants';

const CLEAR = { httpOnly: true, maxAge: 0, path: '/' } as const;

// Proxy Laravel's /broadcasting/auth so Echo can authenticate private channels
// without exposing the Sanctum token to client-side JS (token stays in HttpOnly cookie).
export async function POST(request: NextRequest) {
  const token = request.cookies.get(LARAVEL_TOKEN_COOKIE)?.value;
  if (!token) {
    // No cookie at all — session was never started or was cleared.
    return expiredResponse();
  }

  try {
    const body = await request.text();
    const res = await fetch(`${process.env.LARAVEL_API_URL}/broadcasting/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    if (res.status === 401) {
      // Stale Sanctum token (e.g. after migrate:fresh) — clear both cookies so
      // the Next.js middleware redirects the user to /login on the next navigation.
      console.warn('[broadcasting/auth] stale Sanctum token — clearing session cookies');
      return expiredResponse();
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[POST /api/broadcasting/auth]', err);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

function expiredResponse(): NextResponse {
  const res = NextResponse.json({ message: 'Session expired.', relogin: true }, { status: 401 });
  res.cookies.set(AUTH_COOKIE_NAME,    '', CLEAR);
  res.cookies.set(LARAVEL_TOKEN_COOKIE, '', CLEAR);
  return res;
}
