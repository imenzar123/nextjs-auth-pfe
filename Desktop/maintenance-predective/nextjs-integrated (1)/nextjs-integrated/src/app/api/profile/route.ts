import { NextRequest, NextResponse } from 'next/server';
import { LARAVEL_TOKEN_COOKIE } from '@/backend/lib/constants';

function laravelHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get(LARAVEL_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

  try {
    const body = await request.json();
    const res = await fetch(`${process.env.LARAVEL_API_URL}/api/profile`, {
      method: 'PUT',
      headers: laravelHeaders(token),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[PUT /api/profile]', err);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
