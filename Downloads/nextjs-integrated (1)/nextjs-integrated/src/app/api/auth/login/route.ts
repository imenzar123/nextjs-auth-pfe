import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/backend/services/authService';
import { signToken } from '@/backend/lib/auth';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/backend/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    // ── Input validation ──────────────────────────────────────
    if (!email || typeof email !== 'string' ||
        !password || typeof password !== 'string') {
      return NextResponse.json(
        { message: 'Email et mot de passe requis.' },
        { status: 400 },
      );
    }

    // ── Authenticate ──────────────────────────────────────────
    const user = await loginUser(email.trim(), password);

    if (!user) {
      // Generic message — do not reveal whether email or password is wrong.
      return NextResponse.json(
        { message: 'Identifiants incorrects.' },
        { status: 401 },
      );
    }

    // ── Issue JWT ─────────────────────────────────────────────
    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // ── Build response ────────────────────────────────────────
    const response = NextResponse.json({ user }, { status: 200 });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,                                   // not accessible via JS
      secure: process.env.NODE_ENV === 'production',    // HTTPS only in prod
      sameSite: 'strict',                               // CSRF protection
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[POST /api/auth/login]', err);
    return NextResponse.json(
      { message: 'Erreur serveur. Veuillez réessayer.' },
      { status: 500 },
    );
  }
}
