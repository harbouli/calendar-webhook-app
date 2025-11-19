import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/lib/google-calendar';
import { TokenStorage } from '@/lib/token-storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=missing_code', request.url)
      );
    }

    const client = new GoogleCalendarClient();
    const tokens = await client.getTokensFromCode(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL('/?error=no_access_token', request.url)
      );
    }

    // Save tokens to file
    const storage = new TokenStorage();
    storage.saveTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
    });

    return NextResponse.redirect(new URL('/?authenticated=true', request.url));
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/?error=auth_failed', request.url)
    );
  }
}
