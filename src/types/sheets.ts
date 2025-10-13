/**
 * Google Sheets Type Definitions
 *
 * This file contains all type definitions related to Google Sheets integration,
 * including raw sheet data structures and configuration.
 */

/**
 * Raw row data structure from Google Sheets.
 * Represents a single row as it appears in the spreadsheet.
 *
 * The order of fields corresponds to the column order in Google Sheets:
 * Column A: Company Name
 * Column B: Address
 * Column C: Status
 * Column D: Notes
 * Column E: Latitude
 * Column F: Longitude
 */
export interface SheetRow {
  /** Company name (Column A) */
  companyName: string;
  /** Full street address (Column B) */
  address: string;
  /** Status as string (Column C) - must match Status enum values */
  status: string;
  /** Notes text (Column D) */
  notes: string;
  /** Latitude as string or number (Column E) - may be empty for new entries */
  latitude: string | number;
  /** Longitude as string or number (Column F) - may be empty for new entries */
  longitude: string | number;
}

/**
 * Google Sheets configuration.
 * Contains all necessary information to connect to and read from a specific sheet.
 */
export interface SheetConfig {
  /** Google Sheets spreadsheet ID (from the URL) */
  sheetId: string;
  /** Name of the specific sheet/tab to read from (e.g., "Sheet1") */
  sheetName: string;
  /** Range to read (e.g., "A2:F" for all rows starting from row 2) */
  range: string;
}

/**
 * Extended sheet configuration with authentication details.
 * Used internally by the sheets service for API authentication.
 */
export interface SheetAuthConfig extends SheetConfig {
  /** Google Sheets API key for authentication */
  apiKey?: string;
  /** Service account email for authentication */
  serviceAccountEmail?: string;
  /** Private key for service account authentication */
  privateKey?: string;
}

/**
 * Column mapping configuration.
 * Defines which columns in the sheet correspond to which fields.
 * Allows for flexibility if column order changes.
 */
export interface ColumnMapping {
  /** Column index for company name (0-based) */
  companyName: number;
  /** Column index for address (0-based) */
  address: number;
  /** Column index for status (0-based) */
  status: number;
  /** Column index for notes (0-based) */
  notes: number;
  /** Column index for latitude (0-based) */
  latitude: number;
  /** Column index for longitude (0-based) */
  longitude: number;
}

/**
 * Default column mapping based on the standard sheet structure.
 * Columns: Company Name, Address, Status, Notes, Latitude, Longitude
 */
export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  companyName: 0,
  address: 1,
  status: 2,
  notes: 3,
  latitude: 4,
  longitude: 5,
};

/**
 * Result of a sheet read operation.
 * Contains both the raw rows and metadata about the operation.
 */
export interface SheetReadResult {
  /** Raw rows from the sheet */
  rows: SheetRow[];
  /** Number of rows read */
  rowCount: number;
  /** Whether any rows had missing coordinates */
  hasMissingCoordinates: boolean;
}

/**
 * Result of a sheet write/update operation.
 */
export interface SheetWriteResult {
  /** Whether the write operation succeeded */
  success: boolean;
  /** Number of rows affected */
  rowsUpdated: number;
  /** Error message if the operation failed */
  error?: string;
}

/**
 * Update operation for a specific sheet cell or range.
 */
export interface SheetUpdate {
  /** Row number (1-based, matching Google Sheets row numbers) */
  row: number;
  /** Column letter (A, B, C, etc.) or index (0-based) */
  column: string | number;
  /** New value to write */
  value: string | number;
}

/**
 * Batch update operation for multiple cells.
 * More efficient than individual updates.
 */
export interface SheetBatchUpdate {
  /** Range to update (e.g., "A2:F2") */
  range: string;
  /** Values to write (2D array for multiple rows/columns) */
  values: (string | number)[][];
}

/**
 * Type guard to check if a value is a valid SheetRow.
 * Validates that all required fields are present.
 *
 * @param value - Value to check
 * @returns True if the value is a valid SheetRow
 */
export function isValidSheetRow(value: unknown): value is SheetRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const row = value as Partial<SheetRow>;

  return (
    typeof row.companyName === 'string' &&
    typeof row.address === 'string' &&
    typeof row.status === 'string' &&
    typeof row.notes === 'string' &&
    (typeof row.latitude === 'string' || typeof row.latitude === 'number') &&
    (typeof row.longitude === 'string' || typeof row.longitude === 'number')
  );
}

/**
 * Converts an array of raw values from Google Sheets to a SheetRow object.
 *
 * @param values - Array of cell values from a single row
 * @param mapping - Column mapping configuration
 * @returns Structured SheetRow object
 * @throws Error if required columns are missing
 */
export function parseSheetRow(
  values: (string | number)[],
  mapping: ColumnMapping = DEFAULT_COLUMN_MAPPING
): SheetRow {
  if (values.length < 4) {
    throw new Error('Sheet row must have at least 4 columns (name, address, status, notes)');
  }

  return {
    companyName: String(values[mapping.companyName] || ''),
    address: String(values[mapping.address] || ''),
    status: String(values[mapping.status] || ''),
    notes: String(values[mapping.notes] || ''),
    latitude: values[mapping.latitude] || '',
    longitude: values[mapping.longitude] || '',
  };
}

/**
 * Converts a SheetRow object back to an array of values for writing to Google Sheets.
 *
 * @param row - SheetRow object to convert
 * @param mapping - Column mapping configuration
 * @returns Array of cell values in correct column order
 */
export function sheetRowToArray(
  row: SheetRow,
  mapping: ColumnMapping = DEFAULT_COLUMN_MAPPING
): (string | number)[] {
  const result: (string | number)[] = [];

  result[mapping.companyName] = row.companyName;
  result[mapping.address] = row.address;
  result[mapping.status] = row.status;
  result[mapping.notes] = row.notes;
  result[mapping.latitude] = row.latitude;
  result[mapping.longitude] = row.longitude;

  return result;
}
