import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/lib/google-calendar';
import { getSession } from '@/lib/session';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=missing_code', request.url)
      );
    }

    const client = new GoogleCalendarClient();
    const tokens = await client.getTokensFromCode(code);

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL('/login?error=no_access_token', request.url)
      );
    }

    // Get user info from Google using properly configured OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Save tokens and user info in session
    const session = await getSession();
    session.userId = userInfo.data.id || '';
    session.email = userInfo.data.email || '';
    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token || undefined;
    session.expiryDate = tokens.expiry_date || undefined;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.redirect(new URL('/dashboard?authenticated=true', request.url));
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', request.url)
    );
  }
}
