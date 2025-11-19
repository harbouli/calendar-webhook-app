import { NextRequest } from 'next/server';
import { eventEmitter } from '@/lib/event-emitter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = (data: any) => {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    writer.write(encoder.encode(message));
  };

  // Send initial connection message
  sendEvent({ type: 'connected', timestamp: new Date().toISOString() });

  // Listen for calendar updates
  const onCalendarUpdate = (data: any) => {
    sendEvent({ type: 'calendar-update', data, timestamp: new Date().toISOString() });
  };

  eventEmitter.on('calendar-update', onCalendarUpdate);

  // Keep connection alive with heartbeat
  const heartbeatInterval = setInterval(() => {
    try {
      sendEvent({ type: 'heartbeat', timestamp: new Date().toISOString() });
    } catch (error) {
      clearInterval(heartbeatInterval);
    }
  }, 30000); // Every 30 seconds

  // Cleanup on disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeatInterval);
    eventEmitter.off('calendar-update', onCalendarUpdate);
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
