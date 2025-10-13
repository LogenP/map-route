/**
 * Geocoding Service
 *
 * Handles address to coordinate conversion using Google Geocoding API.
 * Features:
 * - Single and batch geocoding
 * - In-memory caching to reduce API calls
 * - Rate limiting to respect Google API quotas
 * - Coordinate validation
 * - Comprehensive error handling
 *
 * This service uses the Google Geocoding API (REST) to convert addresses
 * to latitude/longitude coordinates.
 *
 * Required environment variables:
 * - NEXT_PUBLIC_MAPS_API_KEY: Google Maps API key with Geocoding API enabled
 *
 * @module geocoding.service
 */

import type {
  Coordinates,
  GeocodingResponse,
} from '@/types/google';
import { GeocodingStatus } from '@/types/google';
import { isValidCoordinates } from '@/lib/constants';

/**
 * Result of a geocoding operation
 */
export interface GeocodingResult {
  /** Whether the geocoding was successful */
  success: boolean;
  /** Coordinates if successful, null otherwise */
  coordinates: Coordinates | null;
  /** Formatted address from Google */
  formattedAddress?: string;
  /** Error message if unsuccessful */
  error?: string;
  /** Original address that was geocoded */
  originalAddress: string;
}

/**
 * Cache entry for geocoding results
 */
interface CacheEntry {
  /** Cached geocoding result */
  result: GeocodingResult;
  /** Timestamp when the entry was cached */
  timestamp: number;
}

/**
 * Configuration for the geocoding service
 */
interface GeocodingConfig {
  /** Google Maps API key */
  apiKey: string;
  /** Base URL for the Geocoding API */
  baseUrl: string;
  /** Cache TTL in milliseconds (1 hour) */
  cacheTtl: number;
  /** Delay between batch requests in milliseconds */
  batchDelay: number;
  /** Maximum number of retries for failed requests */
  maxRetries: number;
}

/**
 * Default configuration for the geocoding service
 */
const DEFAULT_CONFIG: GeocodingConfig = {
  apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY || '',
  baseUrl: 'https://maps.googleapis.com/maps/api/geocode/json',
  cacheTtl: 3600 * 1000, // 1 hour
  batchDelay: 200, // 200ms delay between requests (5 requests per second)
  maxRetries: 2,
};

/**
 * In-memory cache for geocoding results
 * Key: normalized address string
 * Value: CacheEntry with result and timestamp
 */
const geocodingCache = new Map<string, CacheEntry>();

/**
 * Normalizes an address string for cache key generation
 * Converts to lowercase and removes extra whitespace
 *
 * @param address - Address string to normalize
 * @returns Normalized address string
 */
function normalizeAddress(address: string): string {
  return address.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Checks if a cache entry is still valid based on TTL
 *
 * @param entry - Cache entry to check
 * @param ttl - Time to live in milliseconds
 * @returns True if the entry is still valid
 */
function isCacheValid(entry: CacheEntry, ttl: number): boolean {
  return Date.now() - entry.timestamp < ttl;
}

/**
 * Gets a geocoding result from cache if available and valid
 *
 * @param address - Address to look up
 * @param config - Service configuration
 * @returns Cached result if available and valid, undefined otherwise
 */
function getFromCache(
  address: string,
  config: GeocodingConfig
): GeocodingResult | undefined {
  const cacheKey = normalizeAddress(address);
  const entry = geocodingCache.get(cacheKey);

  if (entry && isCacheValid(entry, config.cacheTtl)) {
    return entry.result;
  }

  // Remove expired entry
  if (entry) {
    geocodingCache.delete(cacheKey);
  }

  return undefined;
}

/**
 * Stores a geocoding result in cache
 *
 * @param address - Address that was geocoded
 * @param result - Geocoding result to cache
 */
function storeInCache(address: string, result: GeocodingResult): void {
  const cacheKey = normalizeAddress(address);
  geocodingCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });
}

/**
 * Clears the geocoding cache
 * Useful for testing or manual cache invalidation
 */
export function clearGeocodingCache(): void {
  geocodingCache.clear();
}

/**
 * Gets the current cache size
 *
 * @returns Number of entries in the cache
 */
export function getGeocodingCacheSize(): number {
  return geocodingCache.size;
}

/**
 * Makes a request to the Google Geocoding API
 *
 * @param address - Address to geocode
 * @param config - Service configuration
 * @returns Geocoding API response
 * @throws Error if the API request fails
 */
async function makeGeocodingRequest(
  address: string,
  config: GeocodingConfig
): Promise<GeocodingResponse> {
  const encodedAddress = encodeURIComponent(address);
  const url = `${config.baseUrl}?address=${encodedAddress}&key=${config.apiKey}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Geocoding API HTTP error: ${response.status} ${response.statusText}`
    );
  }

  const data: GeocodingResponse = await response.json();
  return data;
}

/**
 * Validates and extracts coordinates from a geocoding API response
 *
 * @param response - Geocoding API response
 * @param address - Original address (for error messages)
 * @returns GeocodingResult with coordinates or error
 */
function processGeocodingResponse(
  response: GeocodingResponse,
  address: string
): GeocodingResult {
  // Handle error statuses
  if (response.status !== GeocodingStatus.OK) {
    let error: string;

    switch (response.status) {
      case GeocodingStatus.ZERO_RESULTS:
        error = 'Address not found. Please check the address format.';
        break;
      case GeocodingStatus.OVER_QUERY_LIMIT:
        error = 'Geocoding quota exceeded. Please try again later.';
        break;
      case GeocodingStatus.REQUEST_DENIED:
        error = 'Geocoding request denied. Please check API key configuration.';
        break;
      case GeocodingStatus.INVALID_REQUEST:
        error = 'Invalid geocoding request. Address may be malformed.';
        break;
      default:
        error = response.error_message || 'Unknown geocoding error occurred.';
    }

    return {
      success: false,
      coordinates: null,
      error,
      originalAddress: address,
    };
  }

  // Extract coordinates from first result
  const result = response.results[0];
  if (!result || !result.geometry || !result.geometry.location) {
    return {
      success: false,
      coordinates: null,
      error: 'Invalid response structure from Geocoding API.',
      originalAddress: address,
    };
  }

  const { lat, lng } = result.geometry.location;

  // Validate coordinates
  if (!isValidCoordinates(lat, lng)) {
    return {
      success: false,
      coordinates: null,
      error: `Invalid coordinates received: lat=${lat}, lng=${lng}`,
      originalAddress: address,
    };
  }

  // Success
  return {
    success: true,
    coordinates: { lat, lng },
    formattedAddress: result.formatted_address,
    originalAddress: address,
  };
}

/**
 * Converts an address to latitude/longitude coordinates using Google Geocoding API.
 *
 * Features:
 * - Checks cache before making API request
 * - Validates coordinates
 * - Handles all API error cases
 * - Stores successful results in cache
 *
 * @param address - Full address string to geocode
 * @param config - Optional configuration override
 * @returns Promise resolving to coordinates or null if geocoding fails
 *
 * @example
 * ```typescript
 * const coords = await geocodeAddress('1600 Amphitheatre Parkway, Mountain View, CA');
 * if (coords) {
 *   console.log(`Lat: ${coords.lat}, Lng: ${coords.lng}`);
 * }
 * ```
 */
export async function geocodeAddress(
  address: string,
  config: Partial<GeocodingConfig> = {}
): Promise<Coordinates | null> {
  // Validate input
  if (!address || address.trim() === '') {
    console.error('geocodeAddress: Empty address provided');
    return null;
  }

  const fullConfig: GeocodingConfig = { ...DEFAULT_CONFIG, ...config };

  // Check API key
  if (!fullConfig.apiKey) {
    console.error(
      'geocodeAddress: Missing NEXT_PUBLIC_MAPS_API_KEY environment variable'
    );
    return null;
  }

  // Check cache first
  const cached = getFromCache(address, fullConfig);
  if (cached) {
    return cached.coordinates;
  }

  try {
    // Make API request
    const response = await makeGeocodingRequest(address, fullConfig);

    // Process response
    const result = processGeocodingResponse(response, address);

    // Store in cache (even failures, to avoid repeated failed requests)
    storeInCache(address, result);

    // Log failures
    if (!result.success) {
      console.warn(`geocodeAddress: Failed for "${address}": ${result.error}`);
    }

    return result.coordinates;
  } catch (error) {
    // Network or other errors
    console.error(`geocodeAddress: Exception for "${address}":`, error);

    // Store failure in cache to avoid immediate retry
    const failureResult: GeocodingResult = {
      success: false,
      coordinates: null,
      error:
        error instanceof Error ? error.message : 'Unknown error during geocoding',
      originalAddress: address,
    };
    storeInCache(address, failureResult);

    return null;
  }
}

/**
 * Geocodes an address with full result information including formatted address
 *
 * @param address - Address to geocode
 * @param config - Optional configuration override
 * @returns Promise resolving to full GeocodingResult
 *
 * @example
 * ```typescript
 * const result = await geocodeAddressDetailed('1600 Amphitheatre Parkway, Mountain View, CA');
 * if (result.success) {
 *   console.log('Coordinates:', result.coordinates);
 *   console.log('Formatted:', result.formattedAddress);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export async function geocodeAddressDetailed(
  address: string,
  config: Partial<GeocodingConfig> = {}
): Promise<GeocodingResult> {
  // Validate input
  if (!address || address.trim() === '') {
    return {
      success: false,
      coordinates: null,
      error: 'Empty address provided',
      originalAddress: address,
    };
  }

  const fullConfig: GeocodingConfig = { ...DEFAULT_CONFIG, ...config };

  // Check API key
  if (!fullConfig.apiKey) {
    return {
      success: false,
      coordinates: null,
      error: 'Missing NEXT_PUBLIC_MAPS_API_KEY environment variable',
      originalAddress: address,
    };
  }

  // Check cache first
  const cached = getFromCache(address, fullConfig);
  if (cached) {
    return cached;
  }

  try {
    // Make API request
    const response = await makeGeocodingRequest(address, fullConfig);

    // Process response
    const result = processGeocodingResponse(response, address);

    // Store in cache
    storeInCache(address, result);

    // Log failures
    if (!result.success) {
      console.warn(
        `geocodeAddressDetailed: Failed for "${address}": ${result.error}`
      );
    }

    return result;
  } catch (error) {
    // Network or other errors
    console.error(`geocodeAddressDetailed: Exception for "${address}":`, error);

    const failureResult: GeocodingResult = {
      success: false,
      coordinates: null,
      error:
        error instanceof Error ? error.message : 'Unknown error during geocoding',
      originalAddress: address,
    };

    // Store failure in cache
    storeInCache(address, failureResult);

    return failureResult;
  }
}

/**
 * Delays execution for the specified number of milliseconds
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Geocodes multiple addresses with rate limiting to avoid API quota issues.
 *
 * Features:
 * - Processes addresses sequentially with configurable delay
 * - Returns results in the same order as input addresses
 * - Some results may be null if geocoding fails
 * - Uses cache for previously geocoded addresses
 *
 * @param addresses - Array of address strings to geocode
 * @param config - Optional configuration override
 * @returns Promise resolving to array of coordinates (some may be null)
 *
 * @example
 * ```typescript
 * const addresses = [
 *   '1600 Amphitheatre Parkway, Mountain View, CA',
 *   '1 Apple Park Way, Cupertino, CA',
 *   '350 5th Ave, New York, NY'
 * ];
 * const results = await geocodeAddresses(addresses);
 * results.forEach((coords, i) => {
 *   if (coords) {
 *     console.log(`${addresses[i]}: ${coords.lat}, ${coords.lng}`);
 *   } else {
 *     console.log(`${addresses[i]}: Failed to geocode`);
 *   }
 * });
 * ```
 */
export async function geocodeAddresses(
  addresses: string[],
  config: Partial<GeocodingConfig> = {}
): Promise<Array<Coordinates | null>> {
  const fullConfig: GeocodingConfig = { ...DEFAULT_CONFIG, ...config };

  if (addresses.length === 0) {
    return [];
  }

  const results: Array<Coordinates | null> = [];

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];

    // Geocode address
    const coordinates = await geocodeAddress(address, fullConfig);
    results.push(coordinates);

    // Add delay between requests (except for the last one)
    if (i < addresses.length - 1) {
      await delay(fullConfig.batchDelay);
    }
  }

  return results;
}

/**
 * Geocodes multiple addresses with detailed results
 *
 * @param addresses - Array of address strings to geocode
 * @param config - Optional configuration override
 * @returns Promise resolving to array of GeocodingResult objects
 *
 * @example
 * ```typescript
 * const addresses = ['1600 Amphitheatre Parkway, Mountain View, CA'];
 * const results = await geocodeAddressesDetailed(addresses);
 * results.forEach((result) => {
 *   if (result.success) {
 *     console.log(`Success: ${result.formattedAddress}`);
 *   } else {
 *     console.log(`Failed: ${result.error}`);
 *   }
 * });
 * ```
 */
export async function geocodeAddressesDetailed(
  addresses: string[],
  config: Partial<GeocodingConfig> = {}
): Promise<GeocodingResult[]> {
  const fullConfig: GeocodingConfig = { ...DEFAULT_CONFIG, ...config };

  if (addresses.length === 0) {
    return [];
  }

  const results: GeocodingResult[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];

    // Geocode address
    const result = await geocodeAddressDetailed(address, fullConfig);
    results.push(result);

    // Add delay between requests (except for the last one)
    if (i < addresses.length - 1) {
      await delay(fullConfig.batchDelay);
    }
  }

  return results;
}

/**
 * Validates if coordinates are within valid ranges
 *
 * Latitude must be between -90 and 90
 * Longitude must be between -180 and 180
 *
 * @param coordinates - Coordinates to validate
 * @returns True if coordinates are valid
 *
 * @example
 * ```typescript
 * const coords = { lat: 40.7128, lng: -74.0060 };
 * if (validateCoordinates(coords)) {
 *   console.log('Valid coordinates');
 * }
 * ```
 */
export function validateCoordinates(coordinates: Coordinates): boolean {
  return isValidCoordinates(coordinates.lat, coordinates.lng);
}

/**
 * Estimates the number of API calls that can be made per second
 * based on the configured batch delay
 *
 * @param config - Optional configuration override
 * @returns Estimated requests per second
 */
export function getEstimatedRequestsPerSecond(
  config: Partial<GeocodingConfig> = {}
): number {
  const fullConfig: GeocodingConfig = { ...DEFAULT_CONFIG, ...config };
  return 1000 / fullConfig.batchDelay;
}

/**
 * Gets statistics about the geocoding cache
 *
 * @returns Object with cache statistics
 */
export function getCacheStatistics(): {
  size: number;
  successCount: number;
  failureCount: number;
} {
  let successCount = 0;
  let failureCount = 0;

  geocodingCache.forEach((entry) => {
    if (entry.result.success) {
      successCount++;
    } else {
      failureCount++;
    }
  });

  return {
    size: geocodingCache.size,
    successCount,
    failureCount,
  };
}
