/**
 * Type Definitions - Main Export File
 *
 * This file serves as a central export point for all type definitions
 * in the application. Import types from this file in other modules.
 *
 * @example
 * ```typescript
 * import { Location, LocationStatus, ApiResponse } from '@/types';
 * ```
 */

// Location types
export {
  LOCATION_STATUSES,
  STATUS_COLORS,
  type LocationStatus,
  type MarkerColor,
  type Location,
  type LocationUpdate,
  isValidStatus,
  toStatus,
  getMarkerColor,
  getDefaultStatus,
} from './location';

// API types
export {
  type SuccessResponse,
  type ErrorResponse,
  type ApiResponse,
  type GetLocationsResponse,
  type UpdateLocationResponse,
  type UpdateLocationRequest,
  type ValidationError,
  type ValidationErrorResponse,
  isSuccessResponse,
  isErrorResponse,
  isValidationErrorResponse,
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from './api';

// Google Sheets types
export {
  type SheetRow,
  type SheetConfig,
  type SheetAuthConfig,
  type ColumnMapping,
  type SheetReadResult,
  type SheetWriteResult,
  type SheetUpdate,
  type SheetBatchUpdate,
  DEFAULT_COLUMN_MAPPING,
  isValidSheetRow,
  parseSheetRow,
  sheetRowToArray,
} from './sheets';

// Google Maps and Geocoding types
export {
  type Coordinates,
  type GeocodingResponse,
  type GeocodingResult,
  type AddressComponent,
  type Geometry,
  type Viewport,
  type GeocodingRequest,
  type GeocodingResultData,
  type MapConfig,
  type LocationMarkerOptions,
  type InfoWindowConfig,
  GeocodingStatus,
  LocationType,
  isGeocodingSuccess,
  isValidCoordinates,
  parseCoordinate,
  calculateDistance,
  getDirectionsUrl,
} from './google';
