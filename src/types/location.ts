/**
 * Location Type Definitions
 *
 * This file contains all type definitions related to business locations,
 * including status types, location data structures, and marker colors.
 */

/**
 * All possible status values for a business relationship.
 * These statuses are used to color-code markers on the map.
 */
export const LOCATION_STATUSES = [
  'Prospect',
  'Customer',
  'Follow-up',
  'Not interested',
  'Revisit',
] as const;

/**
 * Type representing valid status strings for business relationships.
 * - Prospect → Blue marker (potential customer, not yet contacted or in initial stages)
 * - Customer → Green marker (active customer with signed contract)
 * - Follow-up → Yellow marker (requires follow-up action or additional contact)
 * - Not interested → Red marker (explicitly not interested in services)
 * - Revisit → Orange marker (needs to be revisited at a later date)
 * - Follow-up Date Match → Purple marker (location has a follow-up date matching the selected date)
 */
export type LocationStatus = typeof LOCATION_STATUSES[number];

/**
 * Marker color type for Google Maps markers.
 * These colors are used to render location markers based on status.
 */
export type MarkerColor = 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple';

/**
 * Map of status values to their corresponding marker colors.
 * This ensures consistent color coding across the application.
 */
export const STATUS_COLORS: Record<LocationStatus, MarkerColor> = {
  'Prospect': 'blue',
  'Customer': 'green',
  'Follow-up': 'yellow',
  'Not interested': 'red',
  'Revisit': 'orange',
} as const;

/**
 * Represents a business location on the map.
 *
 * Data is synced with Google Sheets where each Location
 * corresponds to one row in the sheet.
 *
 * @property id - Unique identifier (row number in Google Sheets, 1-indexed)
 * @property companyName - Name of the business
 * @property address - Full street address of the location
 * @property status - Current relationship status with the business
 * @property notes - Free-form text notes about the location/business
 * @property lat - Latitude coordinate (WGS84 decimal degrees)
 * @property lng - Longitude coordinate (WGS84 decimal degrees)
 * @property followUpDate - Optional follow-up date in YYYY-MM-DD format
 */
export interface Location {
  /** Sheet row number (1-indexed) */
  id: number;
  /** Business or company name */
  companyName: string;
  /** Full street address */
  address: string;
  /** Current status of the location */
  status: LocationStatus;
  /** User notes about this location */
  notes: string;
  /** Latitude coordinate (WGS84 decimal degrees) */
  lat: number;
  /** Longitude coordinate (WGS84 decimal degrees) */
  lng: number;
  /** Follow-up date in YYYY-MM-DD format */
  followUpDate?: string;
}

/**
 * Partial update object for PATCH requests.
 * Only status, notes, and followUpDate can be updated through the API.
 *
 * All fields are optional to support partial updates.
 */
export type LocationUpdate = Partial<Pick<Location, 'status' | 'notes' | 'followUpDate'>>;

/**
 * Type guard to check if a string is a valid LocationStatus value.
 * Useful for validating data from external sources like Google Sheets.
 *
 * @param value - String to check
 * @returns True if the string matches a valid LocationStatus value
 *
 * @example
 * if (isValidStatus('Prospect')) {
 *   // TypeScript knows this is a LocationStatus
 * }
 */
export function isValidStatus(value: string): value is LocationStatus {
  return LOCATION_STATUSES.includes(value as LocationStatus);
}

/**
 * Converts a status string to a LocationStatus type.
 * Validates that the string is a valid status value.
 *
 * @param value - Status string from Google Sheets
 * @returns The status value as a LocationStatus type
 * @throws {Error} If the string is not a valid status
 *
 * @example
 * const status = toStatus('Customer'); // Type is LocationStatus
 */
export function toStatus(value: string): LocationStatus {
  if (!isValidStatus(value)) {
    throw new Error(`Invalid status value: ${value}. Must be one of: ${LOCATION_STATUSES.join(', ')}`);
  }
  return value;
}

/**
 * Gets the marker color for a given status.
 *
 * @param status - LocationStatus value
 * @returns Corresponding marker color string
 *
 * @example
 * const color = getMarkerColor('Customer'); // Returns 'green'
 */
export function getMarkerColor(status: LocationStatus): MarkerColor {
  return STATUS_COLORS[status];
}

/**
 * Gets the default status for new locations.
 *
 * @returns The default LocationStatus ('Prospect')
 */
export function getDefaultStatus(): LocationStatus {
  return 'Prospect';
}
