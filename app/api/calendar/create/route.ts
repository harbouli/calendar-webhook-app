import { NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/lib/google-calendar';
import { TokenStorage } from '@/lib/token-storage';

export async function POST(request: Request) {
  try {
    const storage = new TokenStorage();
    const tokens = storage.getTokens();

    if (!tokens) {
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
    client.setCredentials(tokens.access_token, tokens.refresh_token);

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
