# Google Calendar Webhook App

A Next.js application with TypeScript that integrates with Google Calendar API and listens to calendar events via webhooks. Designed for a single admin user without NextAuth.

## Features

- Google OAuth 2.0 authentication for a single admin user
- View upcoming calendar events
- Start/stop webhook notifications for calendar changes
- Real-time webhook endpoint to receive calendar updates
- Clean admin dashboard UI

## Prerequisites

- Node.js 18+ installed
- A Google Cloud Project with Calendar API enabled
- A public URL for webhooks (use ngrok for local development)

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback`
   - Save the Client ID and Client Secret

### 2. Environment Variables

Update the `.env.local` file with your credentials:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Webhook configuration
WEBHOOK_URL=https://your-public-url.com/api/webhook
```

For local development, you'll need a public URL for webhooks:

```bash
# Install ngrok
npm install -g ngrok

# In a separate terminal, create a tunnel
ngrok http 3000

# Use the HTTPS URL from ngrok in your .env.local
WEBHOOK_URL=https://your-ngrok-url.ngrok.io/api/webhook
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Initial Authentication

1. Click "Sign in with Google" on the home page
2. Authorize the application to access your Google Calendar
3. You'll be redirected back to the dashboard

### Managing Webhooks

1. Once authenticated, you'll see the dashboard with:
   - Webhook status (Active/Inactive)
   - Upcoming calendar events

2. Click "Start Watching" to enable webhook notifications
3. Google will send notifications to your webhook URL when calendar events change

### Webhook Notifications

The webhook endpoint at `/api/webhook` receives notifications when:
- Events are created
- Events are updated
- Events are deleted

Check your server console logs to see incoming webhook notifications.

## Project Structure

```
calendar-webhook-app/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts       # Initiate OAuth
│   │   │   ├── callback/route.ts    # Handle OAuth callback
│   │   │   └── status/route.ts      # Check auth status
│   │   ├── calendar/
│   │   │   ├── events/route.ts      # Fetch calendar events
│   │   │   └── watch/route.ts       # Manage webhook subscriptions
│   │   └── webhook/route.ts         # Receive webhook notifications
│   └── page.tsx                     # Main dashboard UI
├── lib/
│   ├── google-calendar.ts           # Google Calendar API client
│   └── token-storage.ts             # Token persistence
└── .env.local                       # Environment variables
```

## API Endpoints

### Authentication

- `GET /api/auth/login` - Redirect to Google OAuth
- `GET /api/auth/callback` - Handle OAuth callback
- `GET /api/auth/status` - Check authentication status

### Calendar Operations

- `GET /api/calendar/events` - Fetch upcoming events
- `POST /api/calendar/watch` - Start webhook notifications
- `DELETE /api/calendar/watch` - Stop webhook notifications
- `GET /api/calendar/watch` - Get webhook status

### Webhooks

- `POST /api/webhook` - Receive Google Calendar notifications

## Security Notes

- OAuth tokens are stored in `tokens.json` (automatically gitignored)
- Only supports a single admin user
- Webhook URL must be publicly accessible and use HTTPS in production
- Consider adding webhook signature verification for production use

## Troubleshooting

### Webhook notifications not received

1. Ensure your WEBHOOK_URL is publicly accessible
2. Verify the URL uses HTTPS (required by Google)
3. Check that the watch channel hasn't expired
4. Look at server console logs for incoming webhook requests

### Authentication errors

1. Verify your Google OAuth credentials are correct
2. Ensure the redirect URI matches exactly in Google Cloud Console
3. Check that the Google Calendar API is enabled

### Token expiration

- Access tokens expire after 1 hour
- The app stores refresh tokens to automatically get new access tokens
- If you get authentication errors, try re-authenticating

## Production Deployment

1. Deploy to a hosting service (Vercel, Railway, etc.)
2. Update the redirect URI in Google Cloud Console
3. Update environment variables with production values
4. Ensure WEBHOOK_URL uses your production domain with HTTPS

## License

MIT
