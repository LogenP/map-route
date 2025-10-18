# Pusher Setup Guide

This guide will walk you through setting up Pusher Channels for real-time location push notifications.

## What is Pusher?

Pusher Channels is a hosted service that provides WebSocket infrastructure for real-time features. We use it to broadcast location push events between users without needing a database or WebSocket server.

## Why Pusher?

- **Works with Vercel**: Unlike traditional WebSockets, Pusher works perfectly with Vercel's serverless architecture
- **Free tier**: 100 concurrent connections, 200k messages/day (perfect for small teams)
- **No database needed**: Push events are ephemeral and don't need persistence
- **Easy setup**: ~10 minutes to get started

## Setup Steps (5-10 minutes)

### 1. Create a Pusher Account

1. Go to [pusher.com/channels](https://pusher.com/channels)
2. Click "Get started free" or "Sign up"
3. Create an account with your email or GitHub

### 2. Create a New Channels App

1. After logging in, click "Create app" or "Channels apps" in the sidebar
2. Fill in the form:
   - **Name**: "Map Route" (or any name you prefer)
   - **Cluster**: Choose the closest region to your users
     - `us2` - US East (Virginia)
     - `us3` - US West (Oregon)
     - `eu` - Europe (Ireland)
     - `ap1` - Asia Pacific (Singapore)
   - **Front-end tech**: Select "React"
   - **Back-end tech**: Select "Node.js"
3. Click "Create app"

### 3. Get Your Credentials

After creating the app, you'll see the "App Keys" page with:
- **app_id** - Your application ID
- **key** - Your public key (safe to expose)
- **secret** - Your secret key (keep this private!)
- **cluster** - Your selected region (e.g., "us2")

### 4. Add to Environment Variables

1. Copy `.env.example` to `.env.local` (if you haven't already):
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your Pusher credentials:
   ```env
   PUSHER_APP_ID=123456
   NEXT_PUBLIC_PUSHER_KEY=abcdef123456
   PUSHER_SECRET=your_secret_key_here
   NEXT_PUBLIC_PUSHER_CLUSTER=us2
   ```

3. Save the file

### 5. Restart Your Development Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 6. Test It Out!

1. Open your app in **two different browser windows** (or one normal + one incognito)
2. In the first window, click on a location to open the InfoWindow
3. Click the purple "Push to Others" button
4. In the second window, you should see the InfoWindow automatically open for that location!

## Deployment to Vercel

When deploying to Vercel, add the Pusher environment variables:

1. Go to your Vercel project settings
2. Navigate to **Settings > Environment Variables**
3. Add all four Pusher variables:
   - `PUSHER_APP_ID`
   - `NEXT_PUBLIC_PUSHER_KEY`
   - `PUSHER_SECRET`
   - `NEXT_PUBLIC_PUSHER_CLUSTER`
4. Redeploy your app

## How It Works

```
User A clicks "Push to Others"
    ↓
Browser sends POST /api/push-location
    ↓
API route broadcasts event via Pusher
    ↓
Pusher sends event to all connected clients
    ↓
User B's browser receives event
    ↓
InfoWindow automatically opens for that location
```

## Troubleshooting

### "Missing Pusher configuration" Error

**Cause**: Environment variables not set or not loaded

**Fix**:
1. Make sure `.env.local` has all four Pusher variables
2. Restart your dev server (`npm run dev`)
3. Clear browser cache and reload

### Push Events Not Received

**Possible causes**:
1. **Different Pusher apps**: Make sure both users are using the same Pusher credentials
2. **Wrong cluster**: Verify `NEXT_PUBLIC_PUSHER_CLUSTER` matches your Pusher app
3. **Browser console errors**: Check for connection errors in browser DevTools

**Debug steps**:
1. Open browser console (F12)
2. Look for `[HomePage] Pusher listener initialized` message
3. Click "Push to Others" and check for `[API] Location X pushed successfully`
4. Check Pusher dashboard for live connection count

### Free Tier Limits

Pusher free tier includes:
- 100 concurrent connections
- 200,000 messages per day
- Unlimited channels

For 2-3 users, you'll never hit these limits. If you grow beyond 100 simultaneous users, you can upgrade to a paid plan.

## Alternative: Polling (No Pusher Required)

If you prefer not to use Pusher, you can implement a simple polling solution:

**Pros**:
- No external service needed
- No environment variables to manage

**Cons**:
- 1-3 second delay instead of instant
- Requires storing "pushed location" in Google Sheets
- More API calls to Google Sheets

See `docs/POLLING_ALTERNATIVE.md` for implementation details (to be created if needed).

## Need Help?

- **Pusher Documentation**: [pusher.com/docs/channels](https://pusher.com/docs/channels)
- **Pusher Support**: [support.pusher.com](https://support.pusher.com)
- **Map Route Issues**: Create an issue in this repository

## Security Notes

- **Secret key**: Never commit `PUSHER_SECRET` to git. It's already in `.gitignore` via `.env.local`
- **Public key**: `NEXT_PUBLIC_PUSHER_KEY` is safe to expose (it's in the browser anyway)
- **Cluster**: Can be public
- **App ID**: Can be public

The secret key is only used server-side in API routes, never exposed to the browser.
