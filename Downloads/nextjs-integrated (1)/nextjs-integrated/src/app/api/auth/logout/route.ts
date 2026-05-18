import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/backend/lib/constants';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Déconnexion réussie.' },
    { status: 200 },
  );

  // Clear the auth cookie by setting maxAge to 0.
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
