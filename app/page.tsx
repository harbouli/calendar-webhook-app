'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface CalendarEvent {
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

interface WatchStatus {
  active: boolean;
  channelId?: string;
  resourceId?: string;
  expiration?: string;
  expired?: boolean;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [watchStatus, setWatchStatus] = useState<WatchStatus | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAuthStatus();

    // Check for authentication success message
    if (searchParams.get('authenticated') === 'true') {
      setMessage('Successfully authenticated with Google!');
      setTimeout(() => setMessage(''), 5000);
    }

    // Check for error message
    const error = searchParams.get('error');
    if (error) {
      setMessage(`Error: ${error}`);
      setTimeout(() => setMessage(''), 5000);
    }
  }, [searchParams]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setAuthenticated(data.authenticated);

      if (data.authenticated) {
        fetchEvents();
        fetchWatchStatus();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events?maxResults=10');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setMessage('Error fetching events');
    }
  };

  const fetchWatchStatus = async () => {
    try {
      const response = await fetch('/api/calendar/watch');
      const data = await response.json();
      setWatchStatus(data);
    } catch (error) {
      console.error('Error fetching watch status:', error);
    }
  };

  const startWatch = async () => {
    try {
      setMessage('Starting webhook watch...');
      const response = await fetch('/api/calendar/watch', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Webhook watch started successfully!');
        fetchWatchStatus();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error starting watch:', error);
      setMessage('Error starting webhook watch');
    }
  };

  const stopWatch = async () => {
    try {
      setMessage('Stopping webhook watch...');
      const response = await fetch('/api/calendar/watch', {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Webhook watch stopped successfully!');
        fetchWatchStatus();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error stopping watch:', error);
      setMessage('Error stopping webhook watch');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            Google Calendar Webhook Admin
          </h1>
          <p className="text-gray-600 mb-6">
            Sign in with your Google account to manage calendar webhooks.
          </p>
          <a
            href="/api/auth/login"
            className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in with Google
          </a>
          {message && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            Calendar Webhook Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your Google Calendar webhook notifications
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-lg">
            {message}
          </div>
        )}

        {/* Webhook Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Webhook Status
          </h2>

          {watchStatus ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  watchStatus.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {watchStatus.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {watchStatus.channelId && (
                <>
                  <div>
                    <span className="font-medium text-gray-700">Channel ID:</span>
                    <span className="ml-2 text-gray-600 font-mono text-sm">
                      {watchStatus.channelId}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Expires:</span>
                    <span className="ml-2 text-gray-600">
                      {formatDate(watchStatus.expiration)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3">
                {!watchStatus.active || watchStatus.expired ? (
                  <button
                    onClick={startWatch}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Watching
                  </button>
                ) : (
                  <button
                    onClick={stopWatch}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Stop Watching
                  </button>
                )}
                <button
                  onClick={fetchWatchStatus}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          ) : (
            <div>Loading watch status...</div>
          )}
        </div>

        {/* Calendar Events */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Upcoming Events
            </h2>
            <button
              onClick={fetchEvents}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Events
            </button>
          </div>

          {events.length === 0 ? (
            <p className="text-gray-500">No upcoming events found.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg text-gray-800">
                    {event.summary || 'Untitled Event'}
                  </h3>
                  {event.description && (
                    <p className="text-gray-600 mt-1">{event.description}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <div>
                      Start: {formatDate(event.start?.dateTime || event.start?.date)}
                    </div>
                    <div>
                      End: {formatDate(event.end?.dateTime || event.end?.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
