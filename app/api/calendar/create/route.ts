import { NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/lib/google-calendar';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { summary, description, startDateTime, endDateTime, location } = body;

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: summary, startDateTime, endDateTime' },
        { status: 400 }
      );
    }

    const client = new GoogleCalendarClient();
    client.setCredentials(session.accessToken, session.refreshToken);

    const event = await client.createEvent({
      summary,
      description,
      startDateTime,
      endDateTime,
      location,
    });

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
