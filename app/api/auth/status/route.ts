import { NextResponse } from 'next/server';
import { TokenStorage } from '@/lib/token-storage';

export async function GET() {
  try {
    const storage = new TokenStorage();
    const isAuthenticated = storage.isAuthenticated();

    return NextResponse.json({
      authenticated: isAuthenticated,
      tokens: isAuthenticated ? storage.getTokens() : null
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    );
  }
}
