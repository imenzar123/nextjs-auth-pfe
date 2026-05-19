import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password, password_confirmation } = body as {
      token?: string;
      email?: string;
      password?: string;
      password_confirmation?: string;
    };

    if (!token || !email || !password || !password_confirmation) {
      return NextResponse.json(
        { message: 'All fields are required.' },
        { status: 400 },
      );
    }

    const laravelRes = await fetch(
      `${process.env.LARAVEL_API_URL}/api/auth/reset-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token, email, password, password_confirmation }),
      },
    );

    const data = await laravelRes.json();

    if (!laravelRes.ok) {
      return NextResponse.json(
        { message: data.message ?? 'Password reset failed. The link may have expired.' },
        { status: laravelRes.status },
      );
    }

    return NextResponse.json({ message: data.message });
  } catch (err) {
    console.error('[POST /api/auth/reset-password]', err);
    return NextResponse.json(
      { message: 'Server error. Please try again.' },
      { status: 500 },
    );
  }
}
