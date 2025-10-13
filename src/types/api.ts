/**
 * API Type Definitions
 *
 * This file contains all type definitions for API requests and responses.
 * These types ensure type safety for client-server communication.
 */

import { Location } from './location';

/**
 * Generic success response wrapper.
 * Used for successful API operations that return data.
 *
 * @template T - The type of data being returned
 */
export interface SuccessResponse<T> {
  /** Indicates the operation was successful */
  success: true;
  /** The response data payload */
  data: T;
}

/**
 * Generic error response wrapper.
 * Used for failed API operations with error details.
 */
export interface ErrorResponse {
  /** Indicates the operation failed */
  success: false;
  /** Human-readable error message */
  error: string;
  /** Optional detailed error information for debugging */
  details?: string;
  /** HTTP status code */
  statusCode?: number;
}

/**
 * Type alias for any API response.
 * Can be either a success or error response.
 *
 * @template T - The type of data in successful responses
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Response type for GET /api/locations endpoint.
 * Returns an array of all locations from Google Sheets.
 */
export interface GetLocationsResponse {
  /** Array of all business locations */
  locations: Location[];
}

/**
 * Response type for PATCH /api/locations/[id] endpoint.
 * Returns the updated location after a successful update.
 */
export interface UpdateLocationResponse {
  /** Indicates the update was successful */
  success: true;
  /** The updated location with new values */
  location: Location;
}

/**
 * Request body type for PATCH /api/locations/[id] endpoint.
 * Contains the fields to be updated.
 */
export interface UpdateLocationRequest {
  /** New status value (optional) */
  status?: string;
  /** New notes text (optional) */
  notes?: string;
  /** New follow-up date in YYYY-MM-DD format (optional) */
  followUpDate?: string;
}

/**
 * Validation error details for request validation failures.
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Description of the validation error */
  message: string;
}

/**
 * Enhanced error response for validation failures.
 * Extends ErrorResponse with detailed validation errors.
 */
export interface ValidationErrorResponse extends ErrorResponse {
  /** Array of validation errors */
  validationErrors: ValidationError[];
}

/**
 * Type guard to check if a response is a success response.
 *
 * @param response - API response to check
 * @returns True if the response indicates success
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if a response is an error response.
 *
 * @param response - API response to check
 * @returns True if the response indicates an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if an error response includes validation errors.
 *
 * @param response - Error response to check
 * @returns True if the response includes validation errors
 */
export function isValidationErrorResponse(
  response: ErrorResponse
): response is ValidationErrorResponse {
  return 'validationErrors' in response;
}

/**
 * Helper function to create a success response.
 *
 * @template T - Type of the response data
 * @param data - Response data payload
 * @returns Formatted success response
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Helper function to create an error response.
 *
 * @param error - Error message
 * @param details - Optional detailed error information
 * @param statusCode - Optional HTTP status code
 * @returns Formatted error response
 */
export function createErrorResponse(
  error: string,
  details?: string,
  statusCode?: number
): ErrorResponse {
  return {
    success: false,
    error,
    ...(details && { details }),
    ...(statusCode && { statusCode }),
  };
}

/**
 * Helper function to create a validation error response.
 *
 * @param validationErrors - Array of validation errors
 * @returns Formatted validation error response
 */
export function createValidationErrorResponse(
  validationErrors: ValidationError[]
): ValidationErrorResponse {
  return {
    success: false,
    error: 'Validation failed',
    validationErrors,
    statusCode: 400,
  };
}
