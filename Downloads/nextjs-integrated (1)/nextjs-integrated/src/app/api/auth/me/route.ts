import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/backend/lib/auth';
import { findUserById } from '@/backend/lib/db';
import { AUTH_COOKIE_NAME } from '@/backend/lib/constants';

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user derived from the JWT cookie.
 * Used by AuthContext on the client to populate user state.
 *
 * 200 → { id, email, name, role }
 * 401 → null  (no cookie, expired, or user not found)
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const payload = await verifyToken(token);
    const dbUser = findUserById(payload.id);

    if (!dbUser) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    });
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
