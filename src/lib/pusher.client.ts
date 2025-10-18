/**
 * Client-side Pusher configuration
 * Used in React components to subscribe to real-time events
 */

import PusherClient from 'pusher-js';

let pusherInstance: PusherClient | null = null;

/**
 * Get or create Pusher client instance
 * @returns Pusher client instance
 */
export function getPusherClient(): PusherClient {
  if (pusherInstance) {
    return pusherInstance;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    throw new Error(
      'Missing Pusher configuration. Please set NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER environment variables.'
    );
  }

  pusherInstance = new PusherClient(key, {
    cluster,
  });

  return pusherInstance;
}
