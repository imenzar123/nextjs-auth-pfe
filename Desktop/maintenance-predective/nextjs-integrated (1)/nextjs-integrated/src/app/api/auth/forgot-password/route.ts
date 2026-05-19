import { NextRequest, NextResponse } from 'next/server';

// Always returns the same success message regardless of whether the email
// is registered — prevents user-enumeration attacks.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body as { email?: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    // Fire-and-forget to Laravel; we never expose the result to the client.
    await fetch(`${process.env.LARAVEL_API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
  } catch (err) {
    console.error('[POST /api/auth/forgot-password]', err);
  }

  // Unconditional 200 — the client always shows the same confirmation message.
  return NextResponse.json({
    message: 'If this email is registered, a password reset link has been sent.',
  });
}
