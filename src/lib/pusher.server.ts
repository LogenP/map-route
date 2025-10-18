/**
 * Server-side Pusher client configuration
 * Used in API routes to broadcast events to connected clients
 */

import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

/**
 * Get or create Pusher server instance
 * @returns Pusher server instance
 */
export function getPusherServer(): Pusher {
  if (pusherInstance) {
    return pusherInstance;
  }

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      'Missing Pusher configuration. Please set PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, and NEXT_PUBLIC_PUSHER_CLUSTER environment variables.'
    );
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherInstance;
}
