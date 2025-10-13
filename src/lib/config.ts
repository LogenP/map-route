/**
 * Application Configuration
 *
 * Centralized configuration management with environment variable validation.
 * This module loads and validates all required environment variables at startup,
 * providing type-safe access to configuration throughout the application.
 *
 * @module config
 */

/**
 * Configuration interface defining all app settings
 */
export interface AppConfig {
  /** Google Maps API key for frontend map rendering */
  googleMaps: {
    /** Public API key for Maps JavaScript API */
    apiKey: string;
    /** Default map center coordinates [lat, lng] */
    defaultCenter: { lat: number; lng: number };
    /** Default zoom level (1-20) */
    defaultZoom: number;
  };

  /** Google Sheets API configuration */
  googleSheets: {
    /** Service account email for authentication */
    serviceAccountEmail: string;
    /** Service account private key for authentication */
    privateKey: string;
    /** Google Sheet ID to read/write data */
    sheetId: string;
    /** Sheet name (tab name) within the Google Sheet */
    sheetName: string;
    /** Optional API key (alternative auth method) */
    apiKey?: string;
  };

  /** Application settings */
  app: {
    /** Node environment (development, production, test) */
    nodeEnv: string;
    /** Enable debug mode for verbose logging */
    debugMode: boolean;
  };
}

/**
 * Validates that a required environment variable exists
 * @param key - Environment variable name
 * @param value - Environment variable value
 * @throws Error if the variable is missing or empty
 */
function validateRequired(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please check your .env.local file and ensure ${key} is set.\n` +
      `See .env.example for reference.`
    );
  }
  return value;
}

/**
 * Validates and returns an optional environment variable
 * @param value - Environment variable value
 * @param defaultValue - Default value if not set
 * @returns The value or default
 */
function validateOptional<T>(value: string | undefined, defaultValue: T): T {
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  return value as unknown as T;
}

/**
 * Parses a coordinate string in format "lat,lng"
 * @param coordString - Coordinate string
 * @param defaultLat - Default latitude
 * @param defaultLng - Default longitude
 * @returns Parsed coordinates object
 */
function parseCoordinates(
  coordString: string | undefined,
  defaultLat: number,
  defaultLng: number
): { lat: number; lng: number } {
  if (!coordString) {
    return { lat: defaultLat, lng: defaultLng };
  }

  const parts = coordString.split(',').map(s => s.trim());
  if (parts.length !== 2) {
    console.warn(
      `Invalid coordinate format: ${coordString}. Expected "lat,lng". Using defaults.`
    );
    return { lat: defaultLat, lng: defaultLng };
  }

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) {
    console.warn(
      `Invalid coordinate values: ${coordString}. Using defaults.`
    );
    return { lat: defaultLat, lng: defaultLng };
  }

  return { lat, lng };
}

/**
 * Parses and validates a numeric environment variable
 * @param value - Environment variable value
 * @param defaultValue - Default value if not set or invalid
 * @returns Parsed number
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parses a boolean environment variable
 * @param value - Environment variable value
 * @param defaultValue - Default value if not set
 * @returns Parsed boolean
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Formats the private key by ensuring proper newline characters
 * Google Service Account private keys need actual newlines, not escaped \n
 * @param key - Raw private key string
 * @returns Formatted private key
 */
function formatPrivateKey(key: string): string {
  // Replace literal \n with actual newlines
  return key.replace(/\\n/g, '\n');
}

/**
 * Loads and validates all environment variables (SERVER-SIDE ONLY)
 * @throws Error if any required variables are missing
 * @returns Validated configuration object
 */
function loadConfig(): AppConfig {
  // Only load server-side config on the server
  if (typeof window !== 'undefined') {
    throw new Error(
      'Server config cannot be loaded in the browser. Use client-config.ts instead.'
    );
  }

  // Validate required environment variables
  const googleMapsApiKey = validateRequired(
    'NEXT_PUBLIC_MAPS_API_KEY',
    process.env.NEXT_PUBLIC_MAPS_API_KEY
  );

  const serviceAccountEmail = validateRequired(
    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  );

  const rawPrivateKey = validateRequired(
    'GOOGLE_PRIVATE_KEY',
    process.env.GOOGLE_PRIVATE_KEY
  );

  const sheetId = validateRequired(
    'SHEET_ID',
    process.env.SHEET_ID
  );

  // Format the private key
  const privateKey = formatPrivateKey(rawPrivateKey);

  // Optional variables with defaults
  const sheetName = validateOptional(
    process.env.SHEET_NAME,
    'Sheet1'
  );

  const sheetsApiKey = process.env.GOOGLE_SHEETS_API_KEY;

  const defaultCenter = parseCoordinates(
    process.env.NEXT_PUBLIC_DEFAULT_MAP_CENTER,
    40.7128,  // New York City latitude
    -74.0060  // New York City longitude
  );

  const defaultZoom = parseNumber(
    process.env.NEXT_PUBLIC_DEFAULT_MAP_ZOOM,
    10
  );

  const nodeEnv = process.env.NODE_ENV || 'development';
  const debugMode = parseBoolean(process.env.DEBUG_MODE, false);

  return {
    googleMaps: {
      apiKey: googleMapsApiKey,
      defaultCenter,
      defaultZoom,
    },
    googleSheets: {
      serviceAccountEmail,
      privateKey,
      sheetId,
      sheetName,
      apiKey: sheetsApiKey,
    },
    app: {
      nodeEnv,
      debugMode,
    },
  };
}

/**
 * Application configuration object
 * Loaded once at module initialization
 * Access this throughout your application for type-safe config access
 *
 * @example
 * ```typescript
 * import { config } from '@/lib/config';
 *
 * // Use in your code
 * const apiKey = config.googleMaps.apiKey;
 * const sheetId = config.googleSheets.sheetId;
 * ```
 */
export const config: AppConfig = loadConfig();

/**
 * Helper function to check if we're in development mode
 */
export const isDevelopment = config.app.nodeEnv === 'development';

/**
 * Helper function to check if we're in production mode
 */
export const isProduction = config.app.nodeEnv === 'production';

/**
 * Helper function to check if debug mode is enabled
 */
export const isDebugMode = config.app.debugMode;

/**
 * Logs configuration status (without exposing sensitive values)
 * Useful for debugging configuration issues
 */
export function logConfigStatus(): void {
  console.log('Configuration Status:');
  console.log('- Environment:', config.app.nodeEnv);
  console.log('- Debug Mode:', config.app.debugMode);
  console.log('- Maps API Key:', config.googleMaps.apiKey ? '✓ Set' : '✗ Missing');
  console.log('- Service Account:', config.googleSheets.serviceAccountEmail ? '✓ Set' : '✗ Missing');
  console.log('- Private Key:', config.googleSheets.privateKey ? '✓ Set' : '✗ Missing');
  console.log('- Sheet ID:', config.googleSheets.sheetId ? '✓ Set' : '✗ Missing');
  console.log('- Sheet Name:', config.googleSheets.sheetName);
  console.log('- Default Center:', `${config.googleMaps.defaultCenter.lat}, ${config.googleMaps.defaultCenter.lng}`);
  console.log('- Default Zoom:', config.googleMaps.defaultZoom);
}

// Log configuration status in development mode
if (isDevelopment && isDebugMode) {
  logConfigStatus();
}
