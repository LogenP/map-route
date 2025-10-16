/**
 * PATCH /api/locations/[id] API Route
 *
 * This endpoint updates a location's status and/or notes in Google Sheets.
 * Only status and notes fields can be updated through this endpoint.
 *
 * @module api/locations/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  UpdateLocationRequest,
  UpdateLocationResponse,
  ErrorResponse,
} from '@/types/api';
import type { Location } from '@/types/location';
import { isValidStatus } from '@/types/location';
import { updateLocation } from '@/services/sheets.service';

/**
 * Validates the update request body.
 *
 * @param body - Request body to validate
 * @returns Validation error message or null if valid
 */
function validateUpdateRequest(body: UpdateLocationRequest): string | null {
  // At least one field must be provided
  if (body.status === undefined && body.notes === undefined && body.followUpDate === undefined) {
    return 'At least one field (status, notes, or followUpDate) must be provided';
  }

  // Validate status if provided
  if (body.status !== undefined) {
    if (typeof body.status !== 'string') {
      return 'Status must be a string';
    }

    if (!isValidStatus(body.status)) {
      return `Invalid status value. Must be one of: Prospect, Customer, Follow-up, Not interested, Revisit`;
    }
  }

  // Validate notes if provided
  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') {
      return 'Notes must be a string';
    }

    // Optional: Add max length validation
    const MAX_NOTES_LENGTH = 500;
    if (body.notes.length > MAX_NOTES_LENGTH) {
      return `Notes must be ${MAX_NOTES_LENGTH} characters or less`;
    }
  }

  // Validate followUpDate if provided
  if (body.followUpDate !== undefined) {
    // Allow empty string or valid date in YYYY-MM-DD format
    if (body.followUpDate !== '' && typeof body.followUpDate !== 'string') {
      return 'Follow-up date must be a string in YYYY-MM-DD format';
    }

    // Validate date format if not empty
    if (body.followUpDate !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(body.followUpDate)) {
        return 'Follow-up date must be in YYYY-MM-DD format';
      }

      // Validate that it's a valid date
      const date = new Date(body.followUpDate);
      if (isNaN(date.getTime())) {
        return 'Follow-up date must be a valid date';
      }
    }
  }

  return null;
}

/**
 * Handles PATCH requests to update a location.
 *
 * Flow:
 * 1. Validate the location ID from URL params
 * 2. Parse and validate the request body
 * 3. Update the location in Google Sheets via sheets service
 * 4. Return the updated location object
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns JSON response with updated location or error
 *
 * @example
 * // Request body:
 * {
 *   "status": "Customer",
 *   "notes": "Signed contract!"
 * }
 *
 * @example
 * // Success response (200):
 * {
 *   "success": true,
 *   "location": {
 *     "id": 5,
 *     "companyName": "Example Corp",
 *     "address": "123 Main St",
 *     "status": "Customer",
 *     "notes": "Signed contract!",
 *     "lat": 40.7128,
 *     "lng": -74.0060
 *   }
 * }
 *
 * @example
 * // Validation error response (400):
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Invalid status value",
 *     "code": "VALIDATION_ERROR"
 *   }
 * }
 *
 * @example
 * // Not found error response (404):
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Location not found",
 *     "code": "NOT_FOUND"
 *   }
 * }
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Await params (Next.js 15 requirement)
    const params = await context.params;

    // Validate and parse location ID
    const idString = params.id;
    const id = parseInt(idString, 10);

    if (isNaN(id) || id < 1) {
      console.warn(`[API] Invalid location ID: ${idString}`);
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Invalid location ID. Must be a positive integer.',
        details: `Received ID: ${idString}`,
        statusCode: 400,
      };

      return NextResponse.json(errorResponse, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Parse request body
    let body: UpdateLocationRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[API] Failed to parse request body:', parseError);
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Parse error',
        statusCode: 400,
      };

      return NextResponse.json(errorResponse, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate request body
    const validationError = validateUpdateRequest(body);
    if (validationError) {
      console.warn(`[API] Validation error for location ${id}:`, validationError);
      const errorResponse: ErrorResponse = {
        success: false,
        error: validationError,
        details: 'Request validation failed',
        statusCode: 400,
      };

      return NextResponse.json(errorResponse, {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    console.log(`[API] PATCH /api/locations/${id}`, body);

    // Update the location in Google Sheets
    let updatedLocation: Location;
    try {
      // Cast body to proper type after validation
      const updateData: Partial<Pick<Location, 'status' | 'notes' | 'followUpDate'>> = {
        ...(body.status !== undefined && { status: body.status as Location['status'] }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.followUpDate !== undefined && { followUpDate: body.followUpDate || undefined }),
      };
      updatedLocation = await updateLocation(id, updateData);
    } catch (updateError) {
      // Check if error is due to location not found
      if (updateError instanceof Error && updateError.message.includes('not found')) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: 'Location not found',
          details: `No location exists with ID ${id}`,
          statusCode: 404,
        };

        return NextResponse.json(errorResponse, {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // Re-throw other errors to be caught by outer try-catch
      throw updateError;
    }

    // Return successful response with updated location
    const response: UpdateLocationResponse = {
      success: true,
      location: updatedLocation,
    };

    console.log(`[API] Successfully updated location ${id}`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    // Log detailed error for debugging
    console.error('[API] Error in PATCH /api/locations/[id]:', error);

    // Determine error details
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // Return user-friendly error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'Failed to update location. Please try again.',
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
