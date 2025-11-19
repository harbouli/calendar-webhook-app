import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();

    // Get Google notification headers
    const channelId = headersList.get('x-goog-channel-id');
    const resourceId = headersList.get('x-goog-resource-id');
    const resourceState = headersList.get('x-goog-resource-state');
    const resourceUri = headersList.get('x-goog-resource-uri');
    const messageNumber = headersList.get('x-goog-message-number');

    console.log('Webhook received:', {
      channelId,
      resourceId,
      resourceState,
      resourceUri,
      messageNumber,
      timestamp: new Date().toISOString()
    });

    // Handle different resource states
    switch (resourceState) {
      case 'sync':
        // Initial sync message when watch is established
        console.log('Watch channel synchronized');
        break;

      case 'exists':
        // Calendar resource exists (normal notification)
        console.log('Calendar event changed');

        // Here you can fetch the updated events
        // You would typically:
        // 1. Get your stored tokens
        // 2. Initialize Google Calendar client
        // 3. Fetch recent events to see what changed
        // 4. Process the changes (store in DB, send notifications, etc.)

        // Example of what you might do:
        // const storage = new TokenStorage();
        // const tokens = storage.getTokens();
        // if (tokens) {
        //   const client = new GoogleCalendarClient();
        //   client.setCredentials(tokens.access_token, tokens.refresh_token);
        //   const events = await client.listEvents(10);
        //   // Process events...
        // }

        break;

      case 'not_exists':
        // Resource was deleted
        console.log('Calendar resource deleted');
        break;

      default:
        console.log('Unknown resource state:', resourceState);
    }

    // Always respond with 200 OK to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent Google from retrying
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
