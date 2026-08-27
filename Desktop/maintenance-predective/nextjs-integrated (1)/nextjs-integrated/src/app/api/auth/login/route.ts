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
    const { email, password } = body as { email?: string; password?: string };

    // ── Input validation ──────────────────────────────────────
    if (!email || typeof email !== 'string' ||
        !password || typeof password !== 'string') {
      return NextResponse.json(
        { message: 'Email et mot de passe requis.' },
        { status: 400 },
      );
    }

    // ── Forward credentials to Laravel ────────────────────────
    const laravelRes = await fetch(
      `${process.env.LARAVEL_API_URL}/api/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      },
    );

    if (!laravelRes.ok) {
      // Relaie le message et le code réels de Laravel (ex: 401 identifiants invalides,
      // 403 compte désactivé) au lieu d'un message générique unique — Laravel gère déjà
      // l'anti-énumération (même message pour email inconnu / mot de passe incorrect),
      // donc ce relais n'introduit aucune fuite d'information supplémentaire.
      const errorData = await laravelRes.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message ?? 'Identifiants incorrects.' },
        { status: laravelRes.status },
      );
    }

    const { token: sanctumToken, user } = await laravelRes.json() as {
      token: string;
      user: AuthUser & { id: number };
    };

    // ── Issue local JWT for middleware (edge-safe, no network call) ──
    const jwt = await signToken({
      id: String(user.id),
      email: user.email,
      role: user.role,
    });

    // ── Build response ────────────────────────────────────────
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };

    const response = NextResponse.json(
      { user: { id: String(user.id), name: user.name, email: user.email, role: user.role } },
      { status: 200 },
    );

    // JWT — read by middleware on every request (fast, no DB hit)
    response.cookies.set(AUTH_COOKIE_NAME, jwt, {
      ...cookieOptions,
      maxAge: AUTH_COOKIE_MAX_AGE,
    });

    // Sanctum token — used by Next.js API routes to proxy calls to Laravel
    response.cookies.set(LARAVEL_TOKEN_COOKIE, sanctumToken, {
      ...cookieOptions,
      maxAge: AUTH_COOKIE_MAX_AGE,
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
