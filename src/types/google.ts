/**
 * Google APIs Type Definitions
 *
 * This file contains type definitions for Google Maps and Geocoding API integrations.
 * It supplements @types/google.maps with additional types specific to our application.
 */

/**
 * Coordinate pair representing a geographic location.
 * Uses WGS84 coordinate system (standard for GPS).
 */
export interface Coordinates {
  /** Latitude in decimal degrees (-90 to 90) */
  lat: number;
  /** Longitude in decimal degrees (-180 to 180) */
  lng: number;
}

/**
 * Google Geocoding API response structure.
 * Represents the full response from a geocoding request.
 */
export interface GeocodingResponse {
  /** Array of geocoding results (usually contains 1 result for exact matches) */
  results: GeocodingResult[];
  /** Status of the geocoding request */
  status: GeocodingStatus;
  /** Error message if status is not OK */
  error_message?: string;
}

/**
 * Single geocoding result containing location information.
 */
export interface GeocodingResult {
  /** Array of address components (street, city, state, etc.) */
  address_components: AddressComponent[];
  /** Formatted full address string */
  formatted_address: string;
  /** Geometry information including location coordinates */
  geometry: Geometry;
  /** Place ID (unique identifier for this location) */
  place_id: string;
  /** Array of location types (e.g., "street_address", "premise") */
  types: string[];
}

/**
 * Address component from geocoding result.
 * Represents a single part of the address (e.g., street number, city).
 */
export interface AddressComponent {
  /** Full name of the component */
  long_name: string;
  /** Abbreviated name of the component */
  short_name: string;
  /** Types/categories this component belongs to */
  types: string[];
}

/**
 * Geometry information from geocoding result.
 */
export interface Geometry {
  /** Precise location coordinates */
  location: Coordinates;
  /** Recommended viewport for displaying this location */
  viewport: Viewport;
  /** Additional location type information */
  location_type: LocationType;
  /** Bounding box for the location (optional) */
  bounds?: Viewport;
}

/**
 * Viewport bounds for map display.
 * Defines a rectangular area on the map.
 */
export interface Viewport {
  /** Northeast corner of the viewport */
  northeast: Coordinates;
  /** Southwest corner of the viewport */
  southwest: Coordinates;
}

/**
 * Possible status values from Google Geocoding API.
 */
export enum GeocodingStatus {
  /** Successful geocoding */
  OK = 'OK',
  /** No results found */
  ZERO_RESULTS = 'ZERO_RESULTS',
  /** Request quota exceeded */
  OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
  /** Request denied (usually invalid API key) */
  REQUEST_DENIED = 'REQUEST_DENIED',
  /** Invalid request (missing address or coordinates) */
  INVALID_REQUEST = 'INVALID_REQUEST',
  /** Unknown error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Location type indicating the precision of the geocoding result.
 */
export enum LocationType {
  /** Precise location (e.g., rooftop) */
  ROOFTOP = 'ROOFTOP',
  /** Interpolated between two precise points */
  RANGE_INTERPOLATED = 'RANGE_INTERPOLATED',
  /** Geometric center of a location (e.g., polyline or polygon) */
  GEOMETRIC_CENTER = 'GEOMETRIC_CENTER',
  /** Approximate location */
  APPROXIMATE = 'APPROXIMATE',
}

/**
 * Geocoding request parameters.
 */
export interface GeocodingRequest {
  /** Address string to geocode */
  address: string;
  /** Optional region bias (e.g., "us" for United States) */
  region?: string;
  /** Optional language for results (e.g., "en" for English) */
  language?: string;
}

/**
 * Result of a geocoding operation in our application.
 * Simplified structure with just the essential data.
 */
export interface GeocodingResultData {
  /** Whether geocoding was successful */
  success: boolean;
  /** Coordinates if successful */
  coordinates?: Coordinates;
  /** Formatted address if successful */
  formattedAddress?: string;
  /** Error message if unsuccessful */
  error?: string;
  /** Original status from Google API */
  status?: GeocodingStatus;
}

/**
 * Configuration for Google Maps component.
 */
export interface MapConfig {
  /** Google Maps API key */
  apiKey: string;
  /** Default center coordinates for the map */
  defaultCenter: Coordinates;
  /** Default zoom level (1-20) */
  defaultZoom: number;
  /** Map type (roadmap, satellite, hybrid, terrain) */
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  /** Whether to show zoom controls */
  zoomControl?: boolean;
  /** Whether to show map type controls */
  mapTypeControl?: boolean;
  /** Whether to show street view controls */
  streetViewControl?: boolean;
  /** Whether to show fullscreen control */
  fullscreenControl?: boolean;
}

/**
 * Custom marker options for location markers.
 */
export interface LocationMarkerOptions {
  /** Position of the marker */
  position: Coordinates;
  /** Marker color (determines icon) */
  color: string;
  /** Marker title (shown on hover) */
  title: string;
  /** Whether the marker is clickable */
  clickable?: boolean;
  /** Optional custom icon URL */
  icon?: string;
  /** Z-index for marker layering */
  zIndex?: number;
}

/**
 * InfoWindow configuration for location details.
 */
export interface InfoWindowConfig {
  /** Content to display (can be HTML string or DOM element) */
  content: string | HTMLElement;
  /** Position to display the InfoWindow */
  position?: Coordinates;
  /** Maximum width of the InfoWindow in pixels */
  maxWidth?: number;
  /** Whether to disable auto-pan when opened */
  disableAutoPan?: boolean;
}

/**
 * Type guard to check if geocoding was successful.
 *
 * @param result - Geocoding result to check
 * @returns True if geocoding was successful
 */
export function isGeocodingSuccess(result: GeocodingResultData): result is GeocodingResultData & {
  coordinates: Coordinates;
  formattedAddress: string;
} {
  return result.success && !!result.coordinates && !!result.formattedAddress;
}

/**
 * Type guard to check if coordinates are valid.
 *
 * @param coords - Coordinates to validate
 * @returns True if coordinates are within valid ranges
 */
export function isValidCoordinates(coords: unknown): coords is Coordinates {
  if (typeof coords !== 'object' || coords === null) {
    return false;
  }

  const c = coords as Partial<Coordinates>;

  return (
    typeof c.lat === 'number' &&
    typeof c.lng === 'number' &&
    c.lat >= -90 &&
    c.lat <= 90 &&
    c.lng >= -180 &&
    c.lng <= 180 &&
    !isNaN(c.lat) &&
    !isNaN(c.lng)
  );
}

/**
 * Converts a string or number to a valid coordinate number.
 * Handles empty strings, invalid formats, etc.
 *
 * @param value - Value to convert
 * @returns Number if valid, null if invalid
 */
export function parseCoordinate(value: string | number): number | null {
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }

    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Calculates the distance between two coordinates using the Haversine formula.
 * Returns distance in kilometers.
 *
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts degrees to radians.
 *
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Generates a Google Maps URL for directions to a location.
 * Opens in Apple Maps on iOS, Google Maps on Android/Web.
 *
 * @param destination - Destination coordinates or address
 * @returns URL string for opening directions
 */
export function getDirectionsUrl(destination: Coordinates | string): string {
  if (typeof destination === 'string') {
    // Address string
    const encoded = encodeURIComponent(destination);
    return `https://maps.google.com/maps?daddr=${encoded}`;
  } else {
    // Coordinates
    return `https://maps.google.com/maps?daddr=${destination.lat},${destination.lng}`;
  }
}
