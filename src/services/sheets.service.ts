/**
 * Google Sheets Service
 *
 * Handles all interactions with the Google Sheets API, including:
 * - Reading location data from the configured sheet
 * - Writing updates back to the sheet (status, notes, coordinates)
 * - Parsing sheet rows into Location objects
 * - Data validation and error handling
 *
 * This service uses Google Service Account authentication for secure API access.
 * Required environment variables:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 * - SHEET_ID
 * - SHEET_NAME
 *
 * @module sheets.service
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

import type { Location, LocationUpdate } from '@/types/location';
import { isValidStatus, getDefaultStatus } from '@/types/location';
import { config } from '@/lib/config';
import { SHEET_COLUMNS, isValidCoordinates } from '@/lib/constants';

/**
 * Google Sheets API client singleton.
 * Initialized lazily on first use.
 */
let sheetsClient: ReturnType<typeof google.sheets> | null = null;

/**
 * Authorized JWT client for Google Sheets API authentication.
 * Initialized lazily on first use.
 */
let authClient: JWT | null = null;

/**
 * Initializes the Google Sheets API client with service account authentication.
 * This function is called automatically on first API request.
 *
 * @throws {Error} If authentication fails or credentials are invalid
 *
 * @example
 * ```typescript
 * await initializeSheetsClient();
 * // Now sheetsClient is ready to use
 * ```
 */
async function initializeSheetsClient(): Promise<void> {
  // Return early if already initialized
  if (sheetsClient && authClient) {
    return;
  }

  try {
    // Create JWT auth client with service account credentials
    authClient = new JWT({
      email: config.googleSheets.serviceAccountEmail,
      key: config.googleSheets.privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Authorize the client
    await authClient.authorize();

    // Initialize sheets API client
    sheetsClient = google.sheets({
      version: 'v4',
      auth: authClient,
    });

    console.log('Google Sheets API client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Sheets API client:', error);
    throw new Error(
      'Unable to authenticate with Google Sheets. Please check your service account credentials.'
    );
  }
}

/**
 * Gets the range string for reading all data rows from the sheet.
 * Assumes first row is headers, starts reading from row 2.
 *
 * @returns Range string in A1 notation (e.g., "Sheet1!A2:I")
 */
function getDataRange(): string {
  return `${config.googleSheets.sheetName}!A2:I`;
}

/**
 * Gets the range string for a specific row in the sheet.
 * Row numbers are 1-indexed (row 1 = headers, row 2 = first data row).
 *
 * @param rowNumber - Row number (1-indexed, matching Google Sheets)
 * @returns Range string in A1 notation (e.g., "Sheet1!A5:I5")
 */
function getRowRange(rowNumber: number): string {
  return `${config.googleSheets.sheetName}!A${rowNumber}:I${rowNumber}`;
}

/**
 * Gets the range string for a specific cell in the sheet.
 *
 * @param rowNumber - Row number (1-indexed)
 * @param columnLetter - Column letter (A, B, C, etc.)
 * @returns Range string in A1 notation (e.g., "Sheet1!C5")
 */
function getCellRange(rowNumber: number, columnLetter: string): string {
  return `${config.googleSheets.sheetName}!${columnLetter}${rowNumber}`;
}

/**
 * Converts a column index to a column letter.
 *
 * @param index - Column index (0-based)
 * @returns Column letter (A, B, C, etc.)
 *
 * @example
 * ```typescript
 * columnIndexToLetter(0) // 'A'
 * columnIndexToLetter(1) // 'B'
 * columnIndexToLetter(25) // 'Z'
 * ```
 */
function columnIndexToLetter(index: number): string {
  return String.fromCharCode(65 + index); // 65 is ASCII code for 'A'
}

/**
 * Converts various date formats to YYYY-MM-DD format.
 * Handles formats like:
 * - 10/13/2025 (MM/DD/YYYY)
 * - 2025-10-13 (YYYY-MM-DD)
 * - Already in YYYY-MM-DD format
 *
 * @param dateStr - Date string in various formats
 * @returns Date in YYYY-MM-DD format or undefined if invalid
 */
function convertDateToISO(dateStr: string): string | undefined {
  if (!dateStr || !dateStr.trim()) {
    return undefined;
  }

  const trimmed = dateStr.trim();

  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle MM/DD/YYYY format (e.g., 10/13/2025)
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  // Try parsing as a date
  try {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.warn(`Unable to parse date: ${dateStr}`);
  }

  return undefined;
}

/**
 * Parses a raw sheet row into a Location object.
 * Validates data and handles missing or invalid values gracefully.
 *
 * @param row - Array of cell values from a single sheet row
 * @param rowIndex - Index of the row (0-based, from data rows only)
 * @returns Location object or null if row is invalid
 *
 * @example
 * ```typescript
 * const row = ['Acme Corp', '123 Main St', 'Customer', 'Notes', '40.7128', '-74.0060'];
 * const location = parseSheetRow(row, 0);
 * // location.id will be 2 (row 1 is headers, row 2 is first data row)
 * ```
 */
function parseSheetRow(row: unknown[], rowIndex: number): Location | null {
  try {
    // Convert row to string array
    const values = row.map((val) => String(val ?? ''));

    // Extract values using column mapping
    const companyName = values[SHEET_COLUMNS.COMPANY_NAME] || '';
    const address = values[SHEET_COLUMNS.ADDRESS] || '';
    const statusStr = values[SHEET_COLUMNS.STATUS] || '';
    const notes = values[SHEET_COLUMNS.NOTES] || '';
    const latStr = values[SHEET_COLUMNS.LATITUDE] || '';
    const lngStr = values[SHEET_COLUMNS.LONGITUDE] || '';
    const followUpDate = values[SHEET_COLUMNS.FOLLOW_UP_DATE] || '';
    const placeId = values[SHEET_COLUMNS.PLACE_ID] || '';
    const photo = values[SHEET_COLUMNS.PHOTO] || '';

    // Validate required fields
    if (!companyName.trim() || !address.trim()) {
      console.warn(
        `Skipping row ${rowIndex + 2}: Missing required fields (company name or address)`
      );
      return null;
    }

    // Validate and parse status
    let status = statusStr.trim();
    if (!status || !isValidStatus(status)) {
      console.warn(
        `Row ${rowIndex + 2}: Invalid status "${statusStr}". Using default status.`
      );
      status = getDefaultStatus();
    }

    // Parse coordinates (may be empty for new entries)
    let lat: number | undefined;
    let lng: number | undefined;

    if (latStr.trim() && lngStr.trim()) {
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || !isValidCoordinates(lat, lng)) {
        console.warn(
          `Row ${rowIndex + 2}: Invalid coordinates (${latStr}, ${lngStr}). Will need geocoding.`
        );
        lat = undefined;
        lng = undefined;
      }
    }

    // Calculate actual row number in sheet (add 2: 1 for header, 1 for 0-based to 1-based)
    const rowNumber = rowIndex + 2;

    // Convert follow-up date to ISO format
    const convertedFollowUpDate = convertDateToISO(followUpDate);

    return {
      id: rowNumber,
      companyName: companyName.trim(),
      address: address.trim(),
      status: status as ReturnType<typeof getDefaultStatus>,
      notes: notes.trim(),
      lat: lat ?? 0, // Use 0 as placeholder for missing coordinates
      lng: lng ?? 0,
      followUpDate: convertedFollowUpDate,
      placeId: placeId.trim() || undefined, // Only include if present
      photo: photo.trim() || undefined, // Only include if present
    };
  } catch (error) {
    console.error(`Error parsing row ${rowIndex + 2}:`, error);
    return null;
  }
}

/**
 * Fetches all locations from Google Sheets.
 * Reads all data rows, parses them into Location objects, and filters out invalid rows.
 *
 * @returns Promise that resolves to an array of Location objects
 * @throws {Error} If the API request fails or authentication is invalid
 *
 * @example
 * ```typescript
 * const locations = await getAllLocations();
 * console.log(`Loaded ${locations.length} locations`);
 * ```
 */
export async function getAllLocations(): Promise<Location[]> {
  try {
    // Ensure client is initialized
    await initializeSheetsClient();

    if (!sheetsClient) {
      throw new Error('Google Sheets client not initialized');
    }

    // Read all data rows from the sheet
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.sheetId,
      range: getDataRange(),
    });

    const rows = response.data.values || [];

    // Return empty array if sheet is empty
    if (rows.length === 0) {
      console.log('No data found in Google Sheet');
      return [];
    }

    // Parse rows into Location objects
    const locations: Location[] = [];
    for (let i = 0; i < rows.length; i++) {
      const location = parseSheetRow(rows[i], i);
      if (location !== null) {
        locations.push(location);
      }
    }

    console.log(`Successfully loaded ${locations.length} locations from Google Sheets`);
    return locations;
  } catch (error) {
    console.error('Failed to fetch locations from Google Sheets:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        throw new Error(
          'Google Sheet not found. Please check your SHEET_ID and ensure the service account has access.'
        );
      }
      if (error.message.includes('403')) {
        throw new Error(
          'Permission denied. Please ensure the service account has access to the Google Sheet.'
        );
      }
    }

    throw new Error(
      'Unable to load locations from Google Sheets. Please try again later.'
    );
  }
}

/**
 * Updates a single location in Google Sheets.
 * Only updates the fields provided in the update object (status and/or notes).
 * Preserves all other data in the row.
 *
 * @param id - Row number (1-indexed) of the location to update
 * @param updates - Object containing fields to update (status and/or notes)
 * @returns Promise that resolves to the updated Location object
 * @throws {Error} If the location is not found or update fails
 *
 * @example
 * ```typescript
 * const updated = await updateLocation(5, {
 *   status: 'Customer',
 *   notes: 'Signed contract!'
 * });
 * console.log(`Updated ${updated.companyName}`);
 * ```
 */
export async function updateLocation(
  id: number,
  updates: LocationUpdate
): Promise<Location> {
  try {
    // Ensure client is initialized
    await initializeSheetsClient();

    if (!sheetsClient) {
      throw new Error('Google Sheets client not initialized');
    }

    // Validate location exists by fetching current row
    const currentRowResponse = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.sheetId,
      range: getRowRange(id),
    });

    const currentRow = currentRowResponse.data.values?.[0];
    if (!currentRow || currentRow.length === 0) {
      throw new Error(`Location with ID ${id} not found`);
    }

    // Build batch update requests for changed fields
    const updateRequests: Array<{ range: string; values: string[][] }> = [];

    // Update status if provided
    if (updates.status !== undefined) {
      // Validate status
      if (!isValidStatus(updates.status)) {
        throw new Error(
          `Invalid status value: ${updates.status}. Must be one of: Prospect, Customer, Follow-up, Not interested, Revisit, Not applicable, Location not found`
        );
      }

      const statusRange = getCellRange(id, columnIndexToLetter(SHEET_COLUMNS.STATUS));
      updateRequests.push({
        range: statusRange,
        values: [[updates.status]],
      });
    }

    // Update notes if provided
    if (updates.notes !== undefined) {
      const notesRange = getCellRange(id, columnIndexToLetter(SHEET_COLUMNS.NOTES));
      updateRequests.push({
        range: notesRange,
        values: [[updates.notes]],
      });
    }

    // Update follow-up date if provided
    if (updates.followUpDate !== undefined) {
      const followUpDateRange = getCellRange(id, columnIndexToLetter(SHEET_COLUMNS.FOLLOW_UP_DATE));
      updateRequests.push({
        range: followUpDateRange,
        values: [[updates.followUpDate]],
      });
    }

    // Perform batch update if there are any changes
    if (updateRequests.length > 0) {
      await sheetsClient.spreadsheets.values.batchUpdate({
        spreadsheetId: config.googleSheets.sheetId,
        requestBody: {
          data: updateRequests,
          valueInputOption: 'RAW',
        },
      });
    }

    // Fetch and return the updated location
    const updatedRowResponse = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.sheetId,
      range: getRowRange(id),
    });

    const updatedRow = updatedRowResponse.data.values?.[0];
    if (!updatedRow) {
      throw new Error('Failed to fetch updated location');
    }

    // Parse the updated row
    const location = parseSheetRow(updatedRow, id - 2); // Convert back to 0-based index
    if (!location) {
      throw new Error('Failed to parse updated location');
    }

    console.log(`Successfully updated location ${id}`);
    return location;
  } catch (error) {
    console.error(`Failed to update location ${id}:`, error);

    if (error instanceof Error) {
      // Re-throw known errors
      if (
        error.message.includes('not found') ||
        error.message.includes('Invalid status')
      ) {
        throw error;
      }

      // Handle API errors
      if (error.message.includes('404')) {
        throw new Error('Location not found in Google Sheets');
      }
      if (error.message.includes('403')) {
        throw new Error('Permission denied. Unable to update location.');
      }
    }

    throw new Error('Unable to update location. Please try again.');
  }
}

/**
 * Sleep utility for retry delays.
 *
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Updates only the coordinates (latitude and longitude) for a location.
 * Used by the geocoding service to add coordinates to locations without them.
 * Preserves all other data in the row.
 *
 * Implements exponential backoff retry logic to handle rate limit errors (429).
 *
 * @param id - Row number (1-indexed) of the location to update
 * @param lat - Latitude coordinate (WGS84 decimal degrees)
 * @param lng - Longitude coordinate (WGS84 decimal degrees)
 * @param retryCount - Current retry attempt (for internal use)
 * @returns Promise that resolves when the update is complete
 * @throws {Error} If coordinates are invalid or update fails after all retries
 *
 * @example
 * ```typescript
 * await updateLocationCoordinates(5, 40.7128, -74.0060);
 * console.log('Coordinates updated successfully');
 * ```
 */
export async function updateLocationCoordinates(
  id: number,
  lat: number,
  lng: number,
  retryCount: number = 0
): Promise<void> {
  const MAX_RETRIES = 5;
  const BASE_DELAY_MS = 1000; // 1 second

  try {
    // Validate coordinates
    if (!isValidCoordinates(lat, lng)) {
      throw new Error(
        `Invalid coordinates: (${lat}, ${lng}). Latitude must be between -90 and 90, longitude between -180 and 180.`
      );
    }

    // Ensure client is initialized
    await initializeSheetsClient();

    if (!sheetsClient) {
      throw new Error('Google Sheets client not initialized');
    }

    // Update both latitude and longitude columns
    const latRange = getCellRange(id, columnIndexToLetter(SHEET_COLUMNS.LATITUDE));
    const lngRange = getCellRange(id, columnIndexToLetter(SHEET_COLUMNS.LONGITUDE));

    await sheetsClient.spreadsheets.values.batchUpdate({
      spreadsheetId: config.googleSheets.sheetId,
      requestBody: {
        data: [
          {
            range: latRange,
            values: [[lat]],
          },
          {
            range: lngRange,
            values: [[lng]],
          },
        ],
        valueInputOption: 'RAW',
      },
    });

    console.log(`Successfully updated coordinates for location ${id}`);
  } catch (error) {
    console.error(`Failed to update coordinates for location ${id}:`, error);

    if (error instanceof Error) {
      // Re-throw validation errors (not retryable)
      if (error.message.includes('Invalid coordinates')) {
        throw error;
      }

      // Handle rate limit errors (429) with exponential backoff
      const isRateLimitError =
        error.message.includes('Quota exceeded') ||
        error.message.includes('429') ||
        error.message.includes('rateLimitExceeded');

      if (isRateLimitError && retryCount < MAX_RETRIES) {
        // Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s
        const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount);
        console.warn(
          `[RETRY ${retryCount + 1}/${MAX_RETRIES}] Rate limit hit for location ${id}. ` +
          `Retrying in ${delayMs}ms...`
        );

        await sleep(delayMs);

        // Recursive retry with incremented count
        return updateLocationCoordinates(id, lat, lng, retryCount + 1);
      }

      // Handle other API errors (not retryable)
      if (error.message.includes('404')) {
        throw new Error('Location not found in Google Sheets');
      }
      if (error.message.includes('403')) {
        throw new Error('Permission denied. Unable to update coordinates.');
      }
    }

    // If we've exhausted retries or it's a non-retryable error
    if (retryCount >= MAX_RETRIES) {
      throw new Error(
        `Failed to update coordinates after ${MAX_RETRIES} retries. Rate limit exceeded.`
      );
    }

    throw new Error('Unable to update location coordinates. Please try again.');
  }
}

/**
 * Validates that the Google Sheets client is properly configured.
 * This function can be called during app initialization to verify setup.
 *
 * @returns Promise that resolves to true if configuration is valid
 * @throws {Error} If configuration is invalid or authentication fails
 *
 * @example
 * ```typescript
 * try {
 *   await validateSheetsAccess();
 *   console.log('Google Sheets access validated');
 * } catch (error) {
 *   console.error('Invalid configuration:', error.message);
 * }
 * ```
 */
export async function validateSheetsAccess(): Promise<boolean> {
  try {
    // Try to initialize and make a simple request
    await initializeSheetsClient();

    if (!sheetsClient) {
      throw new Error('Failed to initialize Sheets client');
    }

    // Attempt to read the sheet metadata
    await sheetsClient.spreadsheets.get({
      spreadsheetId: config.googleSheets.sheetId,
    });

    console.log('Google Sheets access validated successfully');
    return true;
  } catch (error) {
    console.error('Google Sheets access validation failed:', error);
    throw new Error(
      'Unable to access Google Sheets. Please check your configuration and permissions.'
    );
  }
}

/**
 * Gets the total number of data rows in the sheet (excluding header).
 * Useful for pagination or progress tracking.
 *
 * @returns Promise that resolves to the number of data rows
 * @throws {Error} If the API request fails
 *
 * @example
 * ```typescript
 * const count = await getLocationCount();
 * console.log(`Total locations: ${count}`);
 * ```
 */
export async function getLocationCount(): Promise<number> {
  try {
    await initializeSheetsClient();

    if (!sheetsClient) {
      throw new Error('Google Sheets client not initialized');
    }

    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.sheetId,
      range: getDataRange(),
    });

    return response.data.values?.length || 0;
  } catch (error) {
    console.error('Failed to get location count:', error);
    throw new Error('Unable to count locations. Please try again.');
  }
}
