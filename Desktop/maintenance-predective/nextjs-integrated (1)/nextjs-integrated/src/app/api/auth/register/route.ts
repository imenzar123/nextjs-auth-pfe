import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/backend/lib/auth';
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  LARAVEL_TOKEN_COOKIE,
} from '@/backend/lib/constants';
import type { AuthUser } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, password_confirmation } = body as {
      name?: string;
      email?: string;
      password?: string;
      password_confirmation?: string;
    };

    if (!name || !email || !password || !password_confirmation) {
      return NextResponse.json(
        { message: 'All fields are required.' },
        { status: 400 },
      );
    }

    const laravelRes = await fetch(
      `${process.env.LARAVEL_API_URL}/api/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, password_confirmation }),
      },
    );

    const data = await laravelRes.json();

    if (!laravelRes.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Registration failed.', errors: data.errors },
        { status: laravelRes.status },
      );
    }

    const { token: sanctumToken, user } = data as { token: string; user: AuthUser & { id: number } };

    const jwt = await signToken({
      id: String(user.id),
      email: user.email,
      role: user.role,
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE,
    };

    const response = NextResponse.json(
      { user: { id: String(user.id), name: user.name, email: user.email, role: user.role } },
      { status: 201 },
    );

    response.cookies.set(AUTH_COOKIE_NAME, jwt, cookieOptions);
    response.cookies.set(LARAVEL_TOKEN_COOKIE, sanctumToken, cookieOptions);

    return response;
  } catch (err) {
    console.error('[POST /api/auth/register]', err);
    return NextResponse.json(
      { message: 'Server error. Please try again.' },
      { status: 500 },
    );
  }
}
