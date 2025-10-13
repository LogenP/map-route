/**
 * GET /api/locations API Route
 *
 * This endpoint fetches all locations from Google Sheets, geocodes any missing
 * coordinates, updates the sheet with new coordinates, and returns all locations.
 *
 * @module api/locations
 */

import { NextResponse } from 'next/server';
import type { GetLocationsResponse, ErrorResponse } from '@/types/api';
import { getAllLocations, updateLocationCoordinates } from '@/services/sheets.service';
import { geocodeAddress } from '@/services/geocoding.service';

/**
 * In-memory lock to prevent concurrent geocoding operations.
 * Multiple concurrent requests would exceed Google Sheets API rate limits.
 */
let isGeocodingInProgress = false;
let lastGeocodeTime = 0;
const MIN_GEOCODE_INTERVAL_MS = 5000; // Minimum 5 seconds between geocoding batches

/**
 * Processes geocoding in the background for remaining locations.
 * This runs independently from the API request to continuously populate coordinates.
 */
async function processGeocodingQueue(): Promise<void> {
  try {
    // Fetch locations from Google Sheets
    const locations = await getAllLocations();
    const locationsNeedingGeocode = locations.filter(
      (loc) => !loc.lat || !loc.lng || loc.lat === 0 || loc.lng === 0
    );

    if (locationsNeedingGeocode.length === 0) {
      console.log('[BACKGROUND] No more locations need geocoding');
      return;
    }

    // Process one batch
    const BATCH_SIZE = 3;
    const DELAY_BETWEEN_UPDATES_MS = 1000;
    const batchToProcess = locationsNeedingGeocode.slice(0, BATCH_SIZE);

    console.log(`[BACKGROUND] Processing ${batchToProcess.length} of ${locationsNeedingGeocode.length} locations`);

    for (let i = 0; i < batchToProcess.length; i++) {
      const location = batchToProcess[i];
      try {
        const coords = await geocodeAddress(location.address);
        if (coords && !(Math.abs(coords.lat) < 0.01 && Math.abs(coords.lng) < 0.01)) {
          await updateLocationCoordinates(location.id, coords.lat, coords.lng);
          console.log(`[BACKGROUND] Geocoded location ${location.id}: ${location.companyName}`);

          if (i < batchToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_UPDATES_MS));
          }
        }
      } catch (error) {
        console.error(`[BACKGROUND] Error geocoding location ${location.id}:`, error instanceof Error ? error.message : error);
        if (i < batchToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_UPDATES_MS));
        }
      }
    }

    // Schedule next batch if there are more locations
    const remaining = locationsNeedingGeocode.length - batchToProcess.length;
    if (remaining > 0) {
      console.log(`[BACKGROUND] ${remaining} locations remaining. Scheduling next batch in ${MIN_GEOCODE_INTERVAL_MS}ms`);
      setTimeout(() => {
        processGeocodingQueue().catch(err =>
          console.error('[BACKGROUND] Error in background queue:', err)
        );
      }, MIN_GEOCODE_INTERVAL_MS);
    } else {
      console.log('[BACKGROUND] All locations have been geocoded!');
    }
  } catch (error) {
    console.error('[BACKGROUND] Fatal error in background processing:', error);
  }
}

/**
 * Handles GET requests to fetch all locations.
 *
 * Flow:
 * 1. Fetch all locations from Google Sheets via sheets service
 * 2. Check if any locations are missing lat/lng coordinates
 * 3. For locations missing coordinates, use geocoding service to get them
 * 4. Update Google Sheets with newly geocoded coordinates
 * 5. Return all locations with complete coordinate data
 *
 * @param request - Next.js request object
 * @returns JSON response with locations array or error
 *
 * @example
 * // Success response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "locations": [
 *       {
 *         "id": 1,
 *         "companyName": "Example Corp",
 *         "address": "123 Main St",
 *         "status": "Prospect",
 *         "notes": "Called them",
 *         "lat": 40.7128,
 *         "lng": -74.0060
 *       }
 *     ]
 *   }
 * }
 *
 * @example
 * // Error response (500):
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Failed to fetch locations",
 *     "code": "FETCH_ERROR"
 *   }
 * }
 */
export async function GET(): Promise<NextResponse> {
  try {
    console.log('[API] GET /api/locations - Fetching locations from Google Sheets');

    // Fetch all locations from Google Sheets
    const locations = await getAllLocations();

    // Check for locations missing coordinates (lat or lng === 0)
    const locationsNeedingGeocode = locations.filter(
      (loc) => !loc.lat || !loc.lng || loc.lat === 0 || loc.lng === 0
    );

    console.log(`[API] Total locations: ${locations.length}, Missing coordinates: ${locationsNeedingGeocode.length}`);

    // Log first few locations needing geocoding for debugging
    if (locationsNeedingGeocode.length > 0) {
      console.log(`[API] First 5 locations needing coordinates:`,
        locationsNeedingGeocode.slice(0, 5).map(loc => ({
          id: loc.id,
          name: loc.companyName,
          lat: loc.lat,
          lng: loc.lng
        }))
      );
    }

    // Geocode missing coordinates with rate limiting and deduplication
    if (locationsNeedingGeocode.length > 0) {
      // Check if another request is already geocoding
      const now = Date.now();
      const timeSinceLastGeocode = now - lastGeocodeTime;

      if (isGeocodingInProgress) {
        console.log(`[API] Geocoding already in progress, skipping this request. ${locationsNeedingGeocode.length} locations still need coordinates.`);
      } else if (timeSinceLastGeocode < MIN_GEOCODE_INTERVAL_MS) {
        const waitTime = Math.ceil((MIN_GEOCODE_INTERVAL_MS - timeSinceLastGeocode) / 1000);
        console.log(`[API] Too soon since last geocode operation (${timeSinceLastGeocode}ms ago). Wait ${waitTime}s before next batch. ${locationsNeedingGeocode.length} locations still need coordinates.`);
      } else {
        // Set lock
        isGeocodingInProgress = true;
        lastGeocodeTime = now;

        try {
          // Process only first 3 locations per request to avoid rate limits
          // With exponential backoff retries, 3 locations is safer
          const BATCH_SIZE = 3;
          const DELAY_BETWEEN_UPDATES_MS = 1000; // 1 second delay between each coordinate update
          const batchToProcess = locationsNeedingGeocode.slice(0, BATCH_SIZE);
          const remaining = locationsNeedingGeocode.length - batchToProcess.length;

          console.log(`[API] Geocoding ${batchToProcess.length} of ${locationsNeedingGeocode.length} locations needing coordinates`);

      for (let i = 0; i < batchToProcess.length; i++) {
        const location = batchToProcess[i];
        try {
          const coords = await geocodeAddress(location.address);
          if (coords) {
            // Validate coordinates are reasonable (not in the middle of the ocean)
            // Basic sanity check: coordinates should not be exactly 0,0 or close to it
            if (Math.abs(coords.lat) < 0.01 && Math.abs(coords.lng) < 0.01) {
              console.warn(
                `[API] Suspicious coordinates (0,0) for location ${location.id}: ${location.companyName} - Address: "${location.address}"`
              );
              // Don't update with bad coordinates
              continue;
            }

            // Update location object with new coordinates
            location.lat = coords.lat;
            location.lng = coords.lng;

            // Update the sheet with new coordinates (with retry logic built-in)
            await updateLocationCoordinates(location.id, coords.lat, coords.lng);
            console.log(`[API] Geocoded location ${location.id}: ${location.companyName} (${coords.lat}, ${coords.lng})`);

            // Add delay between updates to avoid hitting rate limits (except after last item)
            if (i < batchToProcess.length - 1) {
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_UPDATES_MS));
            }
          } else {
            console.warn(
              `[API] Failed to geocode location ${location.id}: ${location.companyName} - Address: "${location.address}"`
            );
          }
        } catch (geocodeError) {
          const errorMessage = geocodeError instanceof Error ? geocodeError.message : 'Unknown error';
          console.error(
            `[API] Error geocoding location ${location.id} (${location.companyName}) - Address: "${location.address}" - Error: ${errorMessage}`
          );
          // Continue with other locations even if one fails
          // Still add delay to avoid compounding rate limit issues
          if (i < batchToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_UPDATES_MS));
          }
        }
      }

          if (remaining > 0) {
            console.log(`[API] ${remaining} locations still need geocoding. They will be processed on the next request.`);
            // Log the IDs of locations that still need geocoding
            const remainingIds = locationsNeedingGeocode.slice(BATCH_SIZE).map(loc => loc.id);
            console.log(`[API] Locations still needing coordinates: ${remainingIds.slice(0, 10).join(', ')}${remainingIds.length > 10 ? '...' : ''}`);
          }
        } finally {
          // Release lock
          isGeocodingInProgress = false;
        }
      }
    }

    // Log summary of locations with bad coordinates (0,0 or ocean locations)
    const suspiciousLocations = locations.filter(
      (loc) => (loc.lat === 0 && loc.lng === 0) ||
               (Math.abs(loc.lat) < 0.01 && Math.abs(loc.lng) < 0.01 && (loc.lat !== 0 || loc.lng !== 0))
    );
    if (suspiciousLocations.length > 0) {
      console.warn(`[API] Found ${suspiciousLocations.length} locations with suspicious coordinates (likely bad addresses)`);
      suspiciousLocations.slice(0, 5).forEach(loc => {
        console.warn(`  - Location ${loc.id}: ${loc.companyName} at (${loc.lat}, ${loc.lng}) - Address: "${loc.address}"`);
      });
    }

    // Return successful response with locations
    const response: GetLocationsResponse = {
      locations: locations,
    };

    console.log(`[API] Successfully fetched ${locations.length} locations`);

    // Start background processing if there are locations needing geocoding
    // and no background process is already running
    if (locationsNeedingGeocode.length > 0 && !isGeocodingInProgress) {
      console.log('[API] Starting background geocoding queue');
      // Don't await - let it run in background
      setTimeout(() => {
        processGeocodingQueue().catch(err =>
          console.error('[API] Error starting background queue:', err)
        );
      }, MIN_GEOCODE_INTERVAL_MS);
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    // Log detailed error for debugging
    console.error('[API] Error in GET /api/locations:', error);

    // Determine error details
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // Return user-friendly error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Failed to fetch locations. Please try again.',
      details: errorMessage,
      statusCode: 500,
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
