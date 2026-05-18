import { NextRequest, NextResponse } from 'next/server';
import { LARAVEL_TOKEN_COOKIE } from '@/backend/lib/constants';
import type { AuthUser } from '@/types/auth';

/**
 * GET /api/auth/me
 *
 * Proxies to Laravel GET /api/auth/me using the stored Sanctum token.
 * Used by AuthContext on the client to populate user state.
 *
 * 200 → { id, email, name, role }
 * 401 → null  (no cookie, expired, or token revoked in Laravel)
 */
export async function GET(request: NextRequest) {
  const sanctumToken = request.cookies.get(LARAVEL_TOKEN_COOKIE)?.value;

  if (!sanctumToken) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const laravelRes = await fetch(
      `${process.env.LARAVEL_API_URL}/api/auth/me`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${sanctumToken}`,
        },
      },
    );

    if (!laravelRes.ok) {
      return NextResponse.json(null, { status: 401 });
    }

    const user = await laravelRes.json() as AuthUser & { id: number };

    return NextResponse.json({
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
