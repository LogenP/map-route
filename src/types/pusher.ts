/**
 * Pusher event types and payloads for real-time location pushing
 */

/**
 * Event triggered when a user pushes a location to other viewers
 */
export interface PushLocationEvent {
  /** Location ID that was pushed */
  locationId: number;
  /** Name of the person who pushed (optional) */
  pushedBy?: string;
  /** Timestamp when the push occurred */
  pushedAt: number;
}

/**
 * Pusher channel names
 */
export const PUSHER_CHANNELS = {
  LOCATIONS: 'locations',
} as const;

/**
 * Pusher event names
 */
export const PUSHER_EVENTS = {
  LOCATION_PUSHED: 'location-pushed',
} as const;
