/**
 * Client-Side Configuration
 *
 * This config is safe to use in client components (components with 'use client').
 * Only includes NEXT_PUBLIC_* environment variables that are safe to expose to the browser.
 *
 * @module client-config
 */

/**
 * Client configuration interface
 */
export interface ClientConfig {
  /** Google Maps API key for frontend map rendering */
  googleMaps: {
    /** Public API key for Maps JavaScript API */
    apiKey: string;
    /** Default map center coordinates [lat, lng] */
    defaultCenter: { lat: number; lng: number };
    /** Default zoom level (1-20) */
    defaultZoom: number;
  };
}

/**
 * Validates that a required environment variable exists
 * @param key - Environment variable name
 * @param value - Environment variable value
 * @throws Error if the variable is missing or empty
 */
function validateRequired(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please check your .env.local file and ensure ${key} is set.\n` +
      `See .env.example for reference.`
    );
  }
  return value;
}

/**
 * Parses a coordinate string in format "lat,lng"
 * @param coordString - Coordinate string
 * @param defaultLat - Default latitude
 * @param defaultLng - Default longitude
 * @returns Parsed coordinates object
 */
function parseCoordinates(
  coordString: string | undefined,
  defaultLat: number,
  defaultLng: number
): { lat: number; lng: number } {
  if (!coordString) {
    return { lat: defaultLat, lng: defaultLng };
  }

  const parts = coordString.split(',').map(s => s.trim());
  if (parts.length !== 2) {
    console.warn(
      `Invalid coordinate format: ${coordString}. Expected "lat,lng". Using defaults.`
    );
    return { lat: defaultLat, lng: defaultLng };
  }

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) {
    console.warn(
      `Invalid coordinate values: ${coordString}. Using defaults.`
    );
    return { lat: defaultLat, lng: defaultLng };
  }

  return { lat, lng };
}

/**
 * Parses and validates a numeric environment variable
 * @param value - Environment variable value
 * @param defaultValue - Default value if not set or invalid
 * @returns Parsed number
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Loads and validates client-side environment variables
 * @throws Error if any required variables are missing
 * @returns Validated configuration object
 */
function loadClientConfig(): ClientConfig {
  // Validate required environment variables
  const googleMapsApiKey = validateRequired(
    'NEXT_PUBLIC_MAPS_API_KEY',
    process.env.NEXT_PUBLIC_MAPS_API_KEY
  );

  const defaultCenter = parseCoordinates(
    process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER,
    40.7128,  // New York City latitude
    -74.0060  // New York City longitude
  );

  const defaultZoom = parseNumber(
    process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM,
    10
  );

  return {
    googleMaps: {
      apiKey: googleMapsApiKey,
      defaultCenter,
      defaultZoom,
    },
  };
}

/**
 * Client-side configuration object
 * Safe to use in browser/client components
 *
 * @example
 * ```typescript
 * import { clientConfig } from '@/lib/client-config';
 *
 * // Use in client components
 * const apiKey = clientConfig.googleMaps.apiKey;
 * ```
 */
export const clientConfig: ClientConfig = loadClientConfig();
