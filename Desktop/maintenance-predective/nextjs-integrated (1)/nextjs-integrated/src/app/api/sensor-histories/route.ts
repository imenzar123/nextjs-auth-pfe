import { NextRequest, NextResponse } from 'next/server';
import { LARAVEL_TOKEN_COOKIE } from '@/backend/lib/constants';

function laravelHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(LARAVEL_TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

  const qs  = request.nextUrl.searchParams.toString();
  const url = `${process.env.LARAVEL_API_URL}/api/sensor-histories${qs ? `?${qs}` : ''}`;

  try {
    const res  = await fetch(url, { headers: laravelHeaders(token) });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[GET /api/sensor-histories]', err);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
