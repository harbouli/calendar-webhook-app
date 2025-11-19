import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  status?: string;
}

export class GoogleCalendarClient {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      prompt: 'consent'
    });
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  setCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });
  }

  async listEvents(maxResults: number = 10): Promise<CalendarEvent[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const items = response.data.items || [];
    return items.map(event => ({
      id: event.id || undefined,
      summary: event.summary || undefined,
      description: event.description || undefined,
      start: event.start ? {
        dateTime: event.start.dateTime || undefined,
        date: event.start.date || undefined,
      } : undefined,
      end: event.end ? {
        dateTime: event.end.dateTime || undefined,
        date: event.end.date || undefined,
      } : undefined,
      status: event.status || undefined,
    }));
  }

  async createEvent(event: {
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
  }): Promise<CalendarEvent> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    });

    const createdEvent = response.data;
    return {
      id: createdEvent.id || undefined,
      summary: createdEvent.summary || undefined,
      description: createdEvent.description || undefined,
      start: createdEvent.start ? {
        dateTime: createdEvent.start.dateTime || undefined,
        date: createdEvent.start.date || undefined,
      } : undefined,
      end: createdEvent.end ? {
        dateTime: createdEvent.end.dateTime || undefined,
        date: createdEvent.end.date || undefined,
      } : undefined,
      status: createdEvent.status || undefined,
    };
  }

  async watchCalendar(webhookUrl: string, channelId: string): Promise<any> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.watch({
      calendarId: 'primary',
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
      }
    });

    return response.data;
  }

  async stopWatchingCalendar(channelId: string, resourceId: string): Promise<void> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    await calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId: resourceId
      }
    });
  }

  async refreshAccessToken(): Promise<string> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    if (credentials.access_token) {
      return credentials.access_token;
    }
    throw new Error('Failed to refresh access token');
  }
}
