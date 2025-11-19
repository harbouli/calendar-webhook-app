import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/lib/google-calendar';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    const client = new GoogleCalendarClient();
    client.setCredentials(session.accessToken, session.refreshToken);

    const events = await client.listEvents(maxResults);

    return NextResponse.json({
      success: true,
      count: events.length,
      events: events
    });

  } catch (error: any) {
    console.error('Error fetching events:', error);

    // If token expired, try to refresh
    if (error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired')) {
      return NextResponse.json(
        { error: 'Token expired. Please re-authenticate.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
