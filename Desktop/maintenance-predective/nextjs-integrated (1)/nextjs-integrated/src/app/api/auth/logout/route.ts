import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, LARAVEL_TOKEN_COOKIE } from '@/backend/lib/constants';

export async function POST(request: NextRequest) {
  const sanctumToken = request.cookies.get(LARAVEL_TOKEN_COOKIE)?.value;

  // Revoke the token in Laravel (best-effort — clear cookies regardless)
  if (sanctumToken) {
    try {
      await fetch(`${process.env.LARAVEL_API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${sanctumToken}`,
        },
      });
    } catch {
      // Laravel unreachable — still clear cookies locally
    }
  }

  const cookieClearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  };

  const response = NextResponse.json(
    { message: 'Déconnexion réussie.' },
    { status: 200 },
  );

  response.cookies.set(AUTH_COOKIE_NAME, '', cookieClearOptions);
  response.cookies.set(LARAVEL_TOKEN_COOKIE, '', cookieClearOptions);

  return response;
}
