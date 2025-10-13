/**
 * Application Constants
 *
 * Centralized location for all application-wide constants including
 * status mappings, colors, API endpoints, and other fixed values.
 *
 * @module constants
 */

/**
 * Location status types as defined in the Google Sheet
 * These correspond to the "Status" column values
 */
export const STATUS_TYPES = {
  PROSPECT: 'Prospect',
  CUSTOMER: 'Customer',
  FOLLOW_UP: 'Follow-up',
  NOT_INTERESTED: 'Not interested',
  REVISIT: 'Revisit',
  LOCATION_NOT_FOUND: 'Location not found',
} as const;

/**
 * Type for status values
 */
export type StatusType = typeof STATUS_TYPES[keyof typeof STATUS_TYPES];

/**
 * Status to color mapping for map markers
 * Uses Google Maps compatible color codes
 *
 * Color scheme:
 * - Prospect (Blue): New potential customers
 * - Customer (Green): Active customers
 * - Follow-up (Yellow): Requires follow-up action
 * - Not interested (Red): Declined or not interested
 * - Revisit (Orange): To be revisited later
 * - Location not found (Gray): Address could not be verified
 */
export const STATUS_COLORS: Record<StatusType, string> = {
  [STATUS_TYPES.PROSPECT]: '#4285F4',      // Google Blue
  [STATUS_TYPES.CUSTOMER]: '#34A853',      // Google Green
  [STATUS_TYPES.FOLLOW_UP]: '#FBBC04',     // Google Yellow
  [STATUS_TYPES.NOT_INTERESTED]: '#EA4335', // Google Red
  [STATUS_TYPES.REVISIT]: '#FF6D00',       // Orange
  [STATUS_TYPES.LOCATION_NOT_FOUND]: '#9E9E9E', // Gray
};

/**
 * Special color for locations with follow-up date matching selected date
 */
export const FOLLOW_UP_DATE_COLOR = '#9C27B0'; // Purple

/**
 * Status to readable label mapping
 * For display in UI dropdowns and labels
 */
export const STATUS_LABELS: Record<StatusType, string> = {
  [STATUS_TYPES.PROSPECT]: 'Prospect',
  [STATUS_TYPES.CUSTOMER]: 'Customer',
  [STATUS_TYPES.FOLLOW_UP]: 'Follow-up',
  [STATUS_TYPES.NOT_INTERESTED]: 'Not Interested',
  [STATUS_TYPES.REVISIT]: 'Revisit',
  [STATUS_TYPES.LOCATION_NOT_FOUND]: 'Location Not Found',
};

/**
 * Array of all valid status values
 * Useful for dropdowns and validation
 */
export const ALL_STATUSES: StatusType[] = Object.values(STATUS_TYPES);

/**
 * Google Maps marker icon configuration
 * Uses SVG path for custom colored markers
 */
export interface MarkerIconConfig {
  /** SVG path for the marker shape */
  path: string;
  /** Fill color (set dynamically based on status) */
  fillColor: string;
  /** Fill opacity */
  fillOpacity: number;
  /** Stroke color */
  strokeColor: string;
  /** Stroke weight */
  strokeWeight: number;
  /** Scale of the icon */
  scale: number;
  /** Anchor point for the icon */
  anchor?: { x: number; y: number };
}

/**
 * Default marker icon SVG path (pin shape)
 * This is the standard Google Maps pin path
 */
export const MARKER_ICON_PATH = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z';

/**
 * Creates a marker icon configuration with the specified color
 * @param color - Hex color code for the marker
 * @returns Marker icon configuration object
 */
export function createMarkerIcon(color: string): MarkerIconConfig {
  return {
    path: MARKER_ICON_PATH,
    fillColor: color,
    fillOpacity: 0.9,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    scale: 1.5,
    anchor: { x: 12, y: 22 },
  };
}

/**
 * Gets the marker color for a given status
 * @param status - Location status
 * @returns Hex color code
 */
export function getStatusColor(status: StatusType): string {
  return STATUS_COLORS[status] || STATUS_COLORS[STATUS_TYPES.PROSPECT];
}

/**
 * Gets the marker icon configuration for a given status
 * @param status - Location status
 * @returns Marker icon configuration
 */
export function getMarkerIcon(status: StatusType): MarkerIconConfig {
  const color = getStatusColor(status);
  return createMarkerIcon(color);
}

/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  /** Get all locations */
  GET_LOCATIONS: '/api/locations',
  /** Update a specific location */
  UPDATE_LOCATION: (id: number) => `/api/locations/${id}`,
} as const;

/**
 * HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PATCH: 'PATCH',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

/**
 * Google Sheets column mapping
 * Maps column names to their indices (0-based)
 */
export const SHEET_COLUMNS = {
  COMPANY_NAME: 0,
  ADDRESS: 1,
  STATUS: 2,
  NOTES: 3,
  LATITUDE: 4,
  LONGITUDE: 5,
  FOLLOW_UP_DATE: 6,
} as const;

/**
 * Google Sheets column headers
 * Expected header row values in the Google Sheet
 */
export const SHEET_HEADERS = [
  'Company Name',
  'Address',
  'Status',
  'Notes',
  'Latitude',
  'Longitude',
  'Follow-up Date',
] as const;

/**
 * Map configuration constants
 */
export const MAP_CONFIG = {
  /** Minimum zoom level */
  MIN_ZOOM: 1,
  /** Maximum zoom level */
  MAX_ZOOM: 20,
  /** Default zoom for individual location */
  LOCATION_ZOOM: 15,
  /** Map styles (light mode) */
  MAP_STYLES: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
  /** Map control options */
  MAP_OPTIONS: {
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    zoomControl: true,
  },
} as const;

/**
 * UI Configuration constants
 */
export const UI_CONFIG = {
  /** InfoWindow max width */
  INFO_WINDOW_MAX_WIDTH: 300,
  /** Toast notification duration (ms) */
  TOAST_DURATION: 3000,
  /** Loading spinner delay (ms) */
  LOADING_DELAY: 500,
  /** Debounce delay for search/filter (ms) */
  DEBOUNCE_DELAY: 300,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  /** Generic error */
  GENERIC: 'An error occurred. Please try again.',
  /** Network error */
  NETWORK: 'Network error. Please check your connection.',
  /** Failed to load locations */
  LOAD_LOCATIONS: 'Failed to load locations. Please refresh the page.',
  /** Failed to update location */
  UPDATE_LOCATION: 'Failed to update location. Please try again.',
  /** Failed to geocode address */
  GEOCODE: 'Failed to geocode address. Please check the address format.',
  /** Invalid coordinates */
  INVALID_COORDINATES: 'Invalid coordinates provided.',
  /** Missing required field */
  MISSING_FIELD: (field: string) => `Missing required field: ${field}`,
  /** Invalid status */
  INVALID_STATUS: 'Invalid status value provided.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  /** Location updated successfully */
  UPDATE_LOCATION: 'Location updated successfully!',
  /** Data synced with Google Sheets */
  SYNC_SUCCESS: 'Data synced with Google Sheets.',
} as const;

/**
 * Mobile device detection regex
 */
export const MOBILE_USER_AGENT_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/**
 * Checks if the user is on a mobile device
 * @param userAgent - User agent string
 * @returns True if mobile device
 */
export function isMobileDevice(userAgent: string): boolean {
  return MOBILE_USER_AGENT_REGEX.test(userAgent);
}

/**
 * Platform detection for "Get Directions" functionality
 */
export const DIRECTIONS_CONFIG = {
  /** iOS Apple Maps URL scheme */
  IOS_MAPS: (lat: number, lng: number, _name: string) =>
    `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
  /** Android Google Maps URL scheme */
  ANDROID_MAPS: (lat: number, lng: number, _name: string) =>
    `google.navigation:q=${lat},${lng}`,
  /** Web fallback Google Maps URL */
  WEB_MAPS: (lat: number, lng: number, name: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`,
} as const;

/**
 * Gets the appropriate directions URL based on the platform
 * @param lat - Latitude
 * @param lng - Longitude
 * @param name - Location name
 * @param userAgent - User agent string
 * @returns Directions URL
 */
export function getDirectionsUrl(
  lat: number,
  lng: number,
  name: string,
  userAgent: string
): string {
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);

  if (isIOS) {
    return DIRECTIONS_CONFIG.IOS_MAPS(lat, lng, name);
  } else if (isAndroid) {
    return DIRECTIONS_CONFIG.ANDROID_MAPS(lat, lng, name);
  } else {
    return DIRECTIONS_CONFIG.WEB_MAPS(lat, lng, name);
  }
}

/**
 * Validation constants
 */
export const VALIDATION = {
  /** Maximum length for company name */
  MAX_COMPANY_NAME_LENGTH: 100,
  /** Maximum length for address */
  MAX_ADDRESS_LENGTH: 200,
  /** Maximum length for notes */
  MAX_NOTES_LENGTH: 500,
  /** Valid latitude range */
  LATITUDE_RANGE: { min: -90, max: 90 },
  /** Valid longitude range */
  LONGITUDE_RANGE: { min: -180, max: 180 },
} as const;

/**
 * Validates if a status is valid
 * @param status - Status to validate
 * @returns True if valid status
 */
export function isValidStatus(status: string): status is StatusType {
  return ALL_STATUSES.includes(status as StatusType);
}

/**
 * Validates coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns True if valid coordinates
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= VALIDATION.LATITUDE_RANGE.min &&
    lat <= VALIDATION.LATITUDE_RANGE.max &&
    lng >= VALIDATION.LONGITUDE_RANGE.min &&
    lng <= VALIDATION.LONGITUDE_RANGE.max
  );
}

/**
 * Cache duration constants (in seconds)
 */
export const CACHE_DURATION = {
  /** Cache locations for 5 minutes */
  LOCATIONS: 300,
  /** Cache geocoding results for 1 hour */
  GEOCODING: 3600,
} as const;

/**
 * Rate limiting constants
 */
export const RATE_LIMITS = {
  /** Max requests per minute for locations API */
  LOCATIONS_PER_MINUTE: 60,
  /** Max requests per minute for geocoding */
  GEOCODING_PER_MINUTE: 50,
} as const;
