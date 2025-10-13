# Coding Standards - Map Route Project

**Version:** 1.0
**Last Updated:** 2025-10-12
**Purpose:** Mandatory standards for all agents and developers working on the Map Route project.

---

## Table of Contents
1. [TypeScript Standards](#1-typescript-standards)
2. [Naming Conventions](#2-naming-conventions)
3. [Code Organization](#3-code-organization)
4. [Error Handling](#4-error-handling)
5. [React/Next.js Patterns](#5-reactnextjs-patterns)
6. [API Standards](#6-api-standards)
7. [Documentation Requirements](#7-documentation-requirements)
8. [Mobile-First CSS](#8-mobile-first-css)
9. [Testing Standards](#9-testing-standards)
10. [Git Standards](#10-git-standards)

---

## 1. TypeScript Standards

### 1.1 Strict Type Checking
**Rule:** All TypeScript files MUST use strict mode. The `tsconfig.json` must have:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 1.2 No 'any' Types
**Rule:** The `any` type is FORBIDDEN. Use `unknown` for truly unknown types, then narrow with type guards.

**Bad:**
```typescript
function processData(data: any) {
  return data.value;
}
```

**Good:**
```typescript
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error('Invalid data format');
}
```

### 1.3 Interface vs Type
**Rule:** Use `interface` for object shapes that may be extended. Use `type` for unions, intersections, primitives, and utility types.

**Interfaces (for extendable object shapes):**
```typescript
// types/location.ts
export interface Location {
  id: number;
  companyName: string;
  address: string;
  status: LocationStatus;
  notes: string;
  lat: number;
  lng: number;
}

// Can be extended elsewhere
export interface EnhancedLocation extends Location {
  lastVisited: Date;
}
```

**Types (for unions, utilities):**
```typescript
// types/location.ts
export type LocationStatus =
  | 'Prospect'
  | 'Customer'
  | 'Follow-up'
  | 'Not interested'
  | 'Revisit'
  | 'Possibility';

export type LocationUpdate = Partial<Pick<Location, 'status' | 'notes'>>;
```

### 1.4 Enum Usage for Status Types
**Rule:** Use string literal union types (NOT enums) for status values to ensure JSON serialization compatibility.

**Bad:**
```typescript
enum LocationStatus {
  Prospect = 'Prospect',
  Customer = 'Customer'
}
```

**Good:**
```typescript
export const LOCATION_STATUSES = [
  'Prospect',
  'Customer',
  'Follow-up',
  'Not interested',
  'Revisit',
  'Possibility'
] as const;

export type LocationStatus = typeof LOCATION_STATUSES[number];
```

### 1.5 Function Return Types
**Rule:** ALL functions MUST explicitly declare return types (except inline arrow functions in JSX).

**Bad:**
```typescript
function getLocation(id: number) {
  return locations.find(loc => loc.id === id);
}
```

**Good:**
```typescript
function getLocation(id: number): Location | undefined {
  return locations.find(loc => loc.id === id);
}

// Async functions
async function fetchLocations(): Promise<Location[]> {
  const response = await fetch('/api/locations');
  return response.json();
}
```

### 1.6 Null vs Undefined
**Rule:** Use `undefined` for optional values. Use `null` only when interfacing with external APIs that use null.

**Good:**
```typescript
interface Location {
  id: number;
  notes?: string;  // Use undefined for optional
  externalId: string | null;  // Use null only if API requires it
}
```

---

## 2. Naming Conventions

### 2.1 File Naming

**Rule:** Use kebab-case for files, PascalCase for React components.

```
src/
├── components/
│   ├── Map.tsx                    ✅ PascalCase for components
│   ├── LocationMarker.tsx         ✅ PascalCase for components
│   └── LoadingSpinner.tsx         ✅ PascalCase for components
├── services/
│   ├── sheets.service.ts          ✅ kebab-case with .service suffix
│   └── geocoding.service.ts       ✅ kebab-case with .service suffix
├── types/
│   ├── location.ts                ✅ kebab-case for type files
│   └── api.ts                     ✅ kebab-case for type files
├── utils/
│   └── helpers.ts                 ✅ kebab-case for utilities
└── lib/
    ├── config.ts                  ✅ kebab-case for lib files
    └── constants.ts               ✅ kebab-case for lib files
```

### 2.2 Variable Naming

**Rule:** Use camelCase for variables and function parameters.

```typescript
// Good
const locationData: Location[] = [];
const isLoading: boolean = false;
const userPreference: string = 'dark';

function updateLocation(locationId: number, newStatus: LocationStatus): void {
  // ...
}
```

### 2.3 Constant Naming

**Rule:** Use UPPER_SNAKE_CASE for true constants (compile-time values).

```typescript
// lib/constants.ts
export const DEFAULT_MAP_CENTER = { lat: 40.7128, lng: -74.0060 };
export const DEFAULT_MAP_ZOOM = 12;
export const API_TIMEOUT_MS = 5000;
export const MAX_RETRY_ATTEMPTS = 3;

export const STATUS_COLORS: Record<LocationStatus, string> = {
  'Prospect': '#3B82F6',      // Blue
  'Customer': '#10B981',      // Green
  'Follow-up': '#F59E0B',     // Yellow
  'Not interested': '#EF4444', // Red
  'Revisit': '#F97316',       // Orange
  'Possibility': '#8B5CF6'    // Purple
} as const;
```

### 2.4 Function Naming

**Rule:** Use camelCase with descriptive verb prefixes.

| Prefix | Usage | Example |
|--------|-------|---------|
| `get` | Retrieve data (synchronous) | `getLocation()` |
| `fetch` | Retrieve data (asynchronous) | `fetchLocations()` |
| `set` | Set a value | `setStatus()` |
| `update` | Modify existing data | `updateLocation()` |
| `create` | Create new data | `createLocation()` |
| `delete` | Remove data | `deleteLocation()` |
| `is` | Boolean check | `isValidStatus()` |
| `has` | Boolean check for presence | `hasCoordinates()` |
| `handle` | Event handlers | `handleStatusChange()` |

```typescript
// Good examples
function getLocationById(id: number): Location | undefined { }
async function fetchLocationsFromSheets(): Promise<Location[]> { }
function isValidStatus(status: string): status is LocationStatus { }
function handleMarkerClick(event: google.maps.MapMouseEvent): void { }
```

### 2.5 Interface Naming

**Rule:** DO NOT prefix interfaces with 'I'. Use descriptive names.

**Bad:**
```typescript
interface ILocation { }
interface IApiResponse { }
```

**Good:**
```typescript
interface Location { }
interface ApiResponse<T> { }
interface LocationMarkerProps { }
interface SheetsServiceConfig { }
```

### 2.6 Component Props Interface Naming

**Rule:** Suffix component props interfaces with `Props`.

```typescript
// components/LocationMarker.tsx
interface LocationMarkerProps {
  location: Location;
  onUpdate: (id: number, update: LocationUpdate) => void;
  isSelected?: boolean;
}

export function LocationMarker({ location, onUpdate, isSelected }: LocationMarkerProps) {
  // ...
}
```

---

## 3. Code Organization

### 3.1 File Structure

**Rule:** Every file MUST follow this exact order:

```typescript
// 1. 'use client' or 'use server' directive (if needed)
'use client';

// 2. Import statements (in order)
// - External libraries (React, Next.js, etc.)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// - Internal types
import type { Location, LocationStatus } from '@/types/location';

// - Internal components
import { LocationMarker } from '@/components/LocationMarker';

// - Internal utilities/services
import { fetchLocations } from '@/services/sheets.service';

// - Internal constants
import { DEFAULT_MAP_CENTER, STATUS_COLORS } from '@/lib/constants';

// - Styles (if separate)
import styles from './Map.module.css';

// 3. Type definitions (interfaces, types used only in this file)
interface MapState {
  center: google.maps.LatLngLiteral;
  zoom: number;
}

// 4. Constants (values used only in this file)
const MARKER_ANIMATION_DURATION = 300;

// 5. Component or function
export function Map() {
  // Component implementation
}

// 6. Named exports (if multiple exports)
export { Map };
```

### 3.2 Import Ordering

**Rule:** Group and order imports as follows:

```typescript
// 1. React and Next.js
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// 2. Third-party libraries (alphabetical)
import axios from 'axios';
import { GoogleMap, Marker } from '@react-google-maps/api';

// 3. Type imports (use 'type' keyword)
import type { Location } from '@/types/location';
import type { ApiResponse } from '@/types/api';

// 4. Internal components
import { LoadingSpinner } from '@/components/LoadingSpinner';

// 5. Internal services
import { sheetsService } from '@/services/sheets.service';

// 6. Internal utilities
import { formatAddress } from '@/utils/helpers';

// 7. Internal constants/config
import { API_TIMEOUT_MS } from '@/lib/constants';
```

### 3.3 Export Patterns

**Rule:** Use named exports by default. Only use default export for Next.js pages.

**Good (Named exports):**
```typescript
// components/LocationMarker.tsx
export function LocationMarker(props: LocationMarkerProps) { }

// services/sheets.service.ts
export class SheetsService { }
export const sheetsService = new SheetsService();

// types/location.ts
export interface Location { }
export type LocationStatus = ...;
```

**Only for Next.js pages:**
```typescript
// app/page.tsx
export default function HomePage() { }

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) { }
```

### 3.4 Component Structure

**Rule:** Structure React components in this order:

```typescript
'use client';

import { useState } from 'react';
import type { Location } from '@/types/location';

// 1. Props interface
interface LocationMarkerProps {
  location: Location;
  onUpdate: (id: number, update: LocationUpdate) => void;
}

// 2. Component definition
export function LocationMarker({ location, onUpdate }: LocationMarkerProps) {
  // 2a. Hooks (useState, useEffect, etc.)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(location.notes);

  // 2b. Derived state and computations
  const markerColor = STATUS_COLORS[location.status];

  // 2c. Event handlers
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onUpdate(location.id, { notes });
    setIsEditing(false);
  };

  const handleCancel = (): void => {
    setNotes(location.notes);
    setIsEditing(false);
  };

  // 2d. Effects
  useEffect(() => {
    // Effect logic
  }, [location.id]);

  // 2e. Return JSX
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

---

## 4. Error Handling

### 4.1 Try-Catch Patterns

**Rule:** Wrap ALL async operations in try-catch blocks. Always handle errors gracefully.

**Good:**
```typescript
// services/sheets.service.ts
async function fetchLocations(): Promise<Location[]> {
  try {
    const response = await fetch('/api/locations', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<Location[]> = await response.json();
    return data.locations;

  } catch (error) {
    console.error('Failed to fetch locations:', error);
    throw new Error('Unable to load locations. Please try again.');
  }
}
```

### 4.2 API Error Response Format

**Rule:** ALL API routes MUST return consistent error responses.

```typescript
// app/api/locations/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const locations = await sheetsService.getLocations();

    return NextResponse.json({
      success: true,
      locations
    }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to fetch locations',
        code: 'FETCH_ERROR'
      }
    }, { status: 500 });
  }
}
```

**Error Response Structure:**
```typescript
// types/api.ts
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;      // User-facing message
    code: string;         // Error code for debugging
    details?: unknown;    // Optional detailed error info
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data?: T;
  [key: string]: unknown;  // Allow additional fields like 'locations', 'location'
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

### 4.3 User-Facing vs Logging

**Rule:** Separate user-facing messages from detailed error logs.

```typescript
async function updateLocation(id: number, update: LocationUpdate): Promise<Location> {
  try {
    const response = await fetch(`/api/locations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update)
    });

    const data = await response.json();

    if (!data.success) {
      // Log detailed error
      console.error('Update failed:', {
        locationId: id,
        update,
        error: data.error
      });

      // Show user-friendly message
      throw new Error('Unable to update location. Please try again.');
    }

    return data.location;

  } catch (error) {
    // Log full error details
    console.error('Unexpected error updating location:', error);

    // Throw user-friendly message
    throw new Error('Something went wrong. Please refresh and try again.');
  }
}
```

### 4.4 Graceful Degradation

**Rule:** Handle missing/invalid data gracefully without breaking the UI.

```typescript
// components/LocationMarker.tsx
export function LocationMarker({ location }: LocationMarkerProps) {
  // Handle missing coordinates
  if (!location.lat || !location.lng) {
    console.warn(`Location ${location.id} missing coordinates`);
    return null; // Don't render marker
  }

  // Handle invalid status (fallback to default)
  const status = isValidStatus(location.status)
    ? location.status
    : 'Prospect';

  const markerColor = STATUS_COLORS[status];

  return (
    <Marker
      position={{ lat: location.lat, lng: location.lng }}
      icon={{ url: `data:image/svg+xml;utf8,<svg>...</svg>` }}
    />
  );
}

// Type guard
function isValidStatus(status: string): status is LocationStatus {
  return LOCATION_STATUSES.includes(status as LocationStatus);
}
```

---

## 5. React/Next.js Patterns

### 5.1 'use client' vs 'use server'

**Rule:** Be explicit about client/server boundaries.

**Use 'use client' for:**
- Components with interactivity (useState, useEffect, event handlers)
- Components using browser APIs (window, navigator)
- Components using Google Maps API

**Use 'use server' for:**
- Server actions
- API route handlers (implicitly server-side)

**Examples:**

```typescript
// components/Map.tsx (needs client-side APIs)
'use client';

import { useEffect, useState } from 'react';
import { GoogleMap } from '@react-google-maps/api';

export function Map() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // ...
}
```

```typescript
// app/api/locations/route.ts (server-side by default, no directive needed)
import { NextResponse } from 'next/server';

export async function GET() {
  // Server-side logic
}
```

### 5.2 Component Props Interface

**Rule:** Always define props as an interface, typed inline in function parameters.

```typescript
// Good
interface MapProps {
  locations: Location[];
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  onMarkerClick?: (location: Location) => void;
}

export function Map({
  locations,
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  onMarkerClick
}: MapProps) {
  // ...
}
```

### 5.3 Hook Usage Patterns

**Rule:** Follow these patterns for hooks:

```typescript
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export function Map() {
  // 1. State hooks (group related state)
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Computed values with useMemo
  const markers = useMemo(() => {
    return locations.filter(loc => loc.lat && loc.lng);
  }, [locations]);

  // 3. Callbacks with useCallback
  const handleMarkerClick = useCallback((location: Location) => {
    console.log('Clicked:', location.companyName);
  }, []);

  // 4. Effects (document why each effect exists)
  useEffect(() => {
    // Fetch locations on mount
    async function loadLocations() {
      try {
        setIsLoading(true);
        const data = await fetchLocations();
        setLocations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }

    loadLocations();
  }, []); // Empty deps = run once on mount

  // ...
}
```

### 5.4 State Management Approach

**Rule:** Use React state for UI state. No external state management libraries needed for this project.

```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import type { Location } from '@/types/location';

export default function HomePage() {
  // Lift state to common parent
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Pass state and updaters down as props
  return (
    <div>
      <Map
        locations={locations}
        onMarkerClick={setSelectedLocation}
      />
      {selectedLocation && (
        <LocationDetails location={selectedLocation} />
      )}
    </div>
  );
}
```

---

## 6. API Standards

### 6.1 REST Endpoint Naming

**Rule:** Use RESTful conventions with plural nouns.

```
GET    /api/locations          # Get all locations
GET    /api/locations/:id      # Get single location (if needed)
POST   /api/locations          # Create location (if needed)
PATCH  /api/locations/:id      # Update location (partial)
DELETE /api/locations/:id      # Delete location (if needed)
```

### 6.2 Request/Response Formats

**Rule:** ALL API routes accept and return JSON only.

**Request Headers:**
```typescript
{
  'Content-Type': 'application/json'
}
```

**Response Format:**
```typescript
// Success response
{
  "success": true,
  "locations": [...],  // or "location", "data", etc.
  "message": "Optional success message"
}

// Error response
{
  "success": false,
  "error": {
    "message": "User-facing error message",
    "code": "ERROR_CODE",
    "details": { /* optional */ }
  }
}
```

### 6.3 Status Codes

**Rule:** Use these HTTP status codes consistently:

| Code | Usage |
|------|-------|
| 200 | Successful GET, PATCH, DELETE |
| 201 | Successful POST (created) |
| 400 | Bad request (validation error) |
| 404 | Resource not found |
| 500 | Server error |

**Example:**
```typescript
// app/api/locations/[id]/route.ts
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);

    // Validation
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid location ID',
          code: 'INVALID_ID'
        }
      }, { status: 400 });
    }

    const body = await request.json();
    const location = await sheetsService.updateLocation(id, body);

    // Not found
    if (!location) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Location not found',
          code: 'NOT_FOUND'
        }
      }, { status: 404 });
    }

    // Success
    return NextResponse.json({
      success: true,
      location
    }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    }, { status: 500 });
  }
}
```

### 6.4 Error Response Structure

**Rule:** Always include `success`, `error.message`, and `error.code` in error responses.

```typescript
// types/api.ts
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: ErrorCode;
    details?: Record<string, unknown>;
  };
}

export type ErrorCode =
  | 'INVALID_ID'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'FETCH_ERROR'
  | 'UPDATE_ERROR'
  | 'INTERNAL_ERROR'
  | 'GEOCODING_ERROR';
```

---

## 7. Documentation Requirements

### 7.1 JSDoc for Public Functions

**Rule:** ALL exported functions, classes, and methods MUST have JSDoc comments.

```typescript
/**
 * Fetches all locations from Google Sheets and geocodes any missing coordinates.
 *
 * @returns A promise that resolves to an array of Location objects
 * @throws {Error} If the Google Sheets API request fails
 *
 * @example
 * const locations = await fetchLocations();
 * console.log(`Loaded ${locations.length} locations`);
 */
export async function fetchLocations(): Promise<Location[]> {
  // Implementation
}

/**
 * Updates a location's status and/or notes in Google Sheets.
 *
 * @param id - The row number (1-indexed) of the location in the sheet
 * @param update - Object containing status and/or notes to update
 * @returns The updated Location object
 * @throws {Error} If the location is not found or update fails
 *
 * @example
 * const updated = await updateLocation(5, {
 *   status: 'Customer',
 *   notes: 'Signed contract!'
 * });
 */
export async function updateLocation(
  id: number,
  update: LocationUpdate
): Promise<Location> {
  // Implementation
}
```

### 7.2 Inline Comments for Complex Logic

**Rule:** Add comments for non-obvious logic, algorithms, or workarounds.

```typescript
export function parseSheetRow(row: string[]): Location | null {
  // Sheet columns: Company Name | Address | Status | Notes | Latitude | Longitude
  const [companyName, address, status, notes, latStr, lngStr] = row;

  // Skip rows with missing required fields
  if (!companyName || !address) {
    return null;
  }

  // Parse coordinates (may be empty strings for new entries)
  const lat = latStr ? parseFloat(latStr) : undefined;
  const lng = lngStr ? parseFloat(lngStr) : undefined;

  // Validate coordinates if present
  if (lat !== undefined && lng !== undefined) {
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.warn(`Invalid coordinates for ${companyName}: ${lat}, ${lng}`);
      // Continue without coordinates - geocoding service will handle
      return {
        companyName,
        address,
        status: status as LocationStatus,
        notes: notes || '',
        lat: undefined,
        lng: undefined
      };
    }
  }

  return {
    companyName,
    address,
    status: status as LocationStatus,
    notes: notes || '',
    lat,
    lng
  };
}
```

### 7.3 File Header Comments

**Rule:** Add header comments to service files and complex utilities.

```typescript
// services/sheets.service.ts

/**
 * Google Sheets Service
 *
 * Handles all interactions with the Google Sheets API, including:
 * - Reading location data from the configured sheet
 * - Writing updates back to the sheet
 * - Parsing sheet rows into Location objects
 *
 * This service uses the Google Service Account for authentication.
 * Required environment variables:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 * - SHEET_ID
 * - SHEET_NAME
 */

import { google } from 'googleapis';
// ...
```

### 7.4 Type Documentation

**Rule:** Document complex types and interfaces.

```typescript
// types/location.ts

/**
 * Represents a business location on the map.
 *
 * Data is synced with Google Sheets where each Location
 * corresponds to one row in the sheet.
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

  /** Latitude coordinate (may be undefined if not yet geocoded) */
  lat?: number;

  /** Longitude coordinate (may be undefined if not yet geocoded) */
  lng?: number;
}

/**
 * Partial update object for PATCH requests.
 * Only status and notes can be updated through the API.
 */
export type LocationUpdate = Partial<Pick<Location, 'status' | 'notes'>>;
```

### 7.5 README Sections Required

**Rule:** Every major component or service directory should consider a README if complexity warrants it. Otherwise, rely on JSDoc.

---

## 8. Mobile-First CSS

### 8.1 Tailwind Usage Patterns

**Rule:** Always write mobile styles first, then add responsive modifiers.

```tsx
// Good: Mobile-first approach
<div className="
  p-4 text-sm           {/* Mobile: small padding and text */}
  md:p-6 md:text-base   {/* Tablet: medium padding and text */}
  lg:p-8 lg:text-lg     {/* Desktop: large padding and text */}
">
  Content
</div>

// Bad: Desktop-first
<div className="p-8 text-lg md:p-4 md:text-sm">
  Content
</div>
```

### 8.2 Responsive Breakpoints

**Rule:** Use Tailwind's default breakpoints consistently.

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| (none) | 0px | Mobile phones |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Large desktops |

**Example:**
```tsx
export function Map() {
  return (
    <div className="
      h-screen w-full              {/* Full viewport on mobile */}
      md:h-[600px] md:rounded-lg   {/* Fixed height on tablet+ */}
      lg:h-[800px]                 {/* Taller on desktop */}
    ">
      {/* Map content */}
    </div>
  );
}
```

### 8.3 Touch Target Sizes

**Rule:** ALL interactive elements MUST be at least 44x44 pixels (iOS Human Interface Guidelines).

```tsx
// Good: Sufficient touch target
<button className="
  min-h-[44px] min-w-[44px]
  px-4 py-2
  bg-blue-500 text-white rounded-lg
  active:bg-blue-600
  touch-manipulation
">
  Save
</button>

// Good: Icon buttons with proper touch targets
<button className="
  h-12 w-12                    {/* 48px = comfortable touch */}
  flex items-center justify-center
  bg-white rounded-full shadow-md
  active:scale-95 transition-transform
">
  <svg className="h-6 w-6" />
</button>
```

### 8.4 Mobile Performance Considerations

**Rule:** Optimize for mobile performance.

```tsx
// Use will-change for animated elements
<div className="
  will-change-transform
  transition-transform duration-300
">
  Animated content
</div>

// Optimize images for mobile
<img
  src="/marker.png"
  alt="Location marker"
  className="h-8 w-8"
  loading="lazy"
/>

// Disable hover effects on touch devices
<button className="
  bg-blue-500
  md:hover:bg-blue-600    {/* Only enable hover on desktop */}
  active:bg-blue-700      {/* Use active state for touch */}
">
  Click me
</button>
```

### 8.5 Mobile-Specific Utilities

**Rule:** Use these Tailwind utilities for mobile optimization:

```tsx
<div className="
  touch-manipulation          {/* Disable double-tap zoom */}
  select-none                 {/* Prevent text selection on interactive elements */}
  overscroll-none             {/* Prevent pull-to-refresh interference */}
  safe-area-inset             {/* Respect iOS notches/home indicators */}
">
  {/* Content */}
</div>
```

---

## 9. Testing Standards

### 9.1 What Should Be Tested

**Rule:** Focus testing efforts on critical business logic and API contracts.

**Priority 1 (Must test):**
- API route handlers (`/api/locations/*`)
- Service layer functions (`sheets.service.ts`, `geocoding.service.ts`)
- Utility functions (`utils/helpers.ts`)
- Type guards and validators

**Priority 2 (Should test):**
- Complex React components with business logic
- Custom hooks

**Priority 3 (Nice to have):**
- Simple presentational components

### 9.2 Test File Naming

**Rule:** Place test files adjacent to source files with `.test.ts` or `.test.tsx` extension.

```
src/
├── services/
│   ├── sheets.service.ts
│   └── sheets.service.test.ts       ✅
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts              ✅
└── components/
    ├── Map.tsx
    └── Map.test.tsx                 ✅
```

### 9.3 Test Structure

**Rule:** Use the Arrange-Act-Assert pattern with clear test descriptions.

```typescript
// services/sheets.service.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { parseSheetRow } from './sheets.service';

describe('SheetsService', () => {
  describe('parseSheetRow', () => {
    it('should parse a valid row with coordinates', () => {
      // Arrange
      const row = [
        'Acme Corp',
        '123 Main St',
        'Customer',
        'Great client',
        '40.7128',
        '-74.0060'
      ];

      // Act
      const result = parseSheetRow(row);

      // Assert
      expect(result).toEqual({
        companyName: 'Acme Corp',
        address: '123 Main St',
        status: 'Customer',
        notes: 'Great client',
        lat: 40.7128,
        lng: -74.0060
      });
    });

    it('should handle missing coordinates gracefully', () => {
      // Arrange
      const row = ['Acme Corp', '123 Main St', 'Prospect', '', '', ''];

      // Act
      const result = parseSheetRow(row);

      // Assert
      expect(result?.lat).toBeUndefined();
      expect(result?.lng).toBeUndefined();
    });

    it('should return null for invalid rows', () => {
      // Arrange
      const row = ['', '', '', '', '', '']; // Missing required fields

      // Act
      const result = parseSheetRow(row);

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### 9.4 Mock Patterns

**Rule:** Mock external dependencies consistently.

```typescript
// services/geocoding.service.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { geocodeAddress } from './geocoding.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('GeocodingService', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should return coordinates for valid address', async () => {
    // Arrange
    const mockResponse = {
      results: [{
        geometry: {
          location: { lat: 40.7128, lng: -74.0060 }
        }
      }],
      status: 'OK'
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Act
    const result = await geocodeAddress('123 Main St, New York, NY');

    // Assert
    expect(result).toEqual({ lat: 40.7128, lng: -74.0060 });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('geocoding')
    );
  });
});
```

---

## 10. Git Standards

### 10.1 Commit Message Format

**Rule:** Use the Conventional Commits format with clear, descriptive messages.

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
# Good commit messages
git commit -m "feat(api): add PATCH endpoint for location updates"

git commit -m "fix(map): correct marker color for 'Not interested' status"

git commit -m "docs(readme): add setup instructions for Google Sheets API"

git commit -m "refactor(services): extract geocoding logic to separate service"

git commit -m "style(components): format Map component with Prettier"

git commit -m "test(api): add unit tests for location validation"

git commit -m "chore(deps): upgrade Next.js to 14.2.0"
```

**Multi-line commit:**
```bash
git commit -m "feat(map): add real-time location updates

- Implement WebSocket connection for live updates
- Add optimistic UI updates
- Handle connection failures gracefully

Closes #123"
```

### 10.2 Branch Naming

**Rule:** Use descriptive branch names with prefixes (if using branches).

**Format:** `<type>/<short-description>`

**Examples:**
```bash
feature/add-location-filtering
fix/marker-color-bug
docs/update-setup-guide
refactor/sheets-service
```

### 10.3 What NOT to Commit

**Rule:** Never commit these files:

```gitignore
# Environment variables
.env
.env.local
.env.production

# Dependencies
node_modules/
.pnp/

# Build output
.next/
out/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/
```

---

## Enforcement

### Automated Checks (Future)
- ESLint with TypeScript strict rules
- Prettier for code formatting
- Husky pre-commit hooks for linting

### Manual Review
All agents MUST review these standards before writing code.

---

## Quick Reference Checklist

Before submitting code, verify:

- [ ] All TypeScript types are explicit (no `any`)
- [ ] All functions have return type annotations
- [ ] File naming follows conventions (kebab-case or PascalCase)
- [ ] Variables use camelCase, constants use UPPER_SNAKE_CASE
- [ ] Imports are ordered correctly
- [ ] Using named exports (except Next.js pages)
- [ ] All async operations wrapped in try-catch
- [ ] API responses follow standard format
- [ ] All exported functions have JSDoc comments
- [ ] Complex logic has inline comments
- [ ] Mobile-first CSS (base styles, then md:, lg:)
- [ ] Touch targets are at least 44x44px
- [ ] Commit messages follow Conventional Commits format
- [ ] No .env files in commits

---

**Document Version:** 1.0
**Last Updated:** 2025-10-12
**Maintained By:** Coding Standards Agent
