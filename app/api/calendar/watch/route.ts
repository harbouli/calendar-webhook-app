import { NextRequest, NextResponse } from 'next/server';
import { GoogleCalendarClient } from '@/lib/google-calendar';
import { TokenStorage } from '@/lib/token-storage';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const storage = new TokenStorage();
    const tokens = storage.getTokens();

    if (!tokens?.access_token) {
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
    client.setCredentials(tokens.access_token, tokens.refresh_token);

    // Generate a unique channel ID
    const channelId = randomUUID();

    const watchResponse = await client.watchCalendar(webhookUrl, channelId);

    // Save watch channel info
    storage.saveWatchChannel({
      channelId: channelId,
      resourceId: watchResponse.resourceId,
      expiration: parseInt(watchResponse.expiration)
    });

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
    const storage = new TokenStorage();
    const tokens = storage.getTokens();
    const watchChannel = storage.getWatchChannel();

    if (!tokens?.access_token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!watchChannel) {
      return NextResponse.json(
        { error: 'No active watch channel' },
        { status: 404 }
      );
    }

    const client = new GoogleCalendarClient();
    client.setCredentials(tokens.access_token, tokens.refresh_token);

    await client.stopWatchingCalendar(watchChannel.channelId, watchChannel.resourceId);

    // Clear watch channel info
    storage.clearWatchChannel();

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
    const storage = new TokenStorage();
    const watchChannel = storage.getWatchChannel();

    if (!watchChannel) {
      return NextResponse.json({
        active: false,
        message: 'No active watch channel'
      });
    }

    const now = Date.now();
    const isExpired = watchChannel.expiration < now;

    return NextResponse.json({
      active: !isExpired,
      channelId: watchChannel.channelId,
      resourceId: watchChannel.resourceId,
      expiration: new Date(watchChannel.expiration).toISOString(),
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
