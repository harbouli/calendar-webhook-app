import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/lib/google-calendar';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'WEBHOOK_URL not configured' },
        { status: 500 }
      );
    }

    const client = new GoogleCalendarClient();
    client.setCredentials(session.accessToken, session.refreshToken);

    // Generate a unique channel ID with user ID
    const channelId = `${session.userId}-${randomUUID()}`;

    const watchResponse = await client.watchCalendar(webhookUrl, channelId);

    // Save watch channel info in session
    session.watchChannel = {
      channelId: channelId,
      resourceId: watchResponse.resourceId,
      expiration: parseInt(watchResponse.expiration)
    };
    await session.save();

    return NextResponse.json({
      success: true,
      channelId: channelId,
      resourceId: watchResponse.resourceId,
      expiration: new Date(parseInt(watchResponse.expiration)).toISOString()
    });

  } catch (error: any) {
    console.error('Error setting up watch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set up calendar watch' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!session.watchChannel) {
      return NextResponse.json(
        { error: 'No active watch channel' },
        { status: 404 }
      );
    }

    const client = new GoogleCalendarClient();
    client.setCredentials(session.accessToken, session.refreshToken);

    await client.stopWatchingCalendar(session.watchChannel.channelId, session.watchChannel.resourceId);

    // Clear watch channel info from session
    session.watchChannel = undefined;
    await session.save();

    return NextResponse.json({
      success: true,
      message: 'Watch channel stopped'
    });

  } catch (error: any) {
    console.error('Error stopping watch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to stop calendar watch' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session.watchChannel) {
      return NextResponse.json({
        active: false,
        message: 'No active watch channel'
      });
    }

    const now = Date.now();
    const isExpired = session.watchChannel.expiration < now;

    return NextResponse.json({
      active: !isExpired,
      channelId: session.watchChannel.channelId,
      resourceId: session.watchChannel.resourceId,
      expiration: new Date(session.watchChannel.expiration).toISOString(),
      expired: isExpired
    });

  } catch (error: any) {
    console.error('Error getting watch status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get watch status' },
      { status: 500 }
    );
  }
}
