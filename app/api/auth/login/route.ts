import { NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/lib/google-calendar';

export async function GET() {
  try {
    const client = new GoogleCalendarClient();
    const authUrl = client.getAuthUrl();

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authentication' },
      { status: 500 }
    );
  }
}
