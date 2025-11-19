import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      authenticated: session.isLoggedIn || false,
      user: session.isLoggedIn ? {
        userId: session.userId,
        email: session.email,
      } : null
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
