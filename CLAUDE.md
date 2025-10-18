# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Map Route is a mobile-first web application for tracking business locations on Google Maps with real-time Google Sheets synchronization. Built with Next.js 15, TypeScript (strict mode), and the Google Cloud Platform APIs.

## Essential Commands

### Development
```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Build production bundle
npm start            # Run production build locally
npm run lint         # Run ESLint checks
npx tsc --noEmit     # Type-check without emitting files
```

### Deployment
```bash
vercel               # Deploy to Vercel (requires Vercel CLI)
```

## Core Architecture

### Data Flow Pattern
1. **Loading Locations**: App → GET /api/locations → sheets.service → Google Sheets API → geocoding.service (for missing coords) → Update sheet → Return locations → Render markers
2. **Updating Location**: User edits → PATCH /api/locations/[id] → sheets.service → Google Sheets API → Return updated location → Update UI
3. **Pushing Location**: User clicks "Push to Others" → POST /api/push-location → Pusher API → Real-time broadcast → All connected clients → Auto-open InfoWindow

### Key Architectural Decisions

**Server-Side API Pattern**: All Google Sheets/Geocoding operations run server-side through Next.js API routes (`/api/locations/*`). This protects service account credentials and handles rate limiting centrally.

**Geocoding Strategy**: The GET /api/locations endpoint implements background geocoding with:
- Batch processing (3 locations per request)
- Rate limiting (5-second minimum interval between batches)
- Exponential backoff retries for Google Sheets API quota errors
- In-memory lock to prevent concurrent geocoding operations
- Background queue for remaining locations

**Client-Side Map Rendering**: Map component uses `@googlemaps/js-api-loader` with custom SVG markers colored by status. Markers are re-created (not updated) when location data changes.

**Sheet Row = Location ID**: Each location's `id` is its row number in Google Sheets (1-indexed, where row 1 is headers). This means row 2 = location id 2.

**Real-Time Push Notifications**: Uses Pusher Channels for instant location sharing between users. When one user clicks "Push to Others", all connected clients receive a real-time event that automatically opens the InfoWindow for that location. This enables seamless collaboration without database persistence.

## Google Sheets Integration

### Sheet Structure
Expected columns (A-G):
| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Company Name | Address | Status | Notes | Latitude | Longitude | Follow-up Date |

### Important Implementation Details

1. **Column Mapping**: Defined in `src/lib/constants.ts` as `SHEET_COLUMNS` (0-based indices)
2. **Service Account Auth**: Uses JWT authentication with `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`
3. **Coordinate Updates**: `updateLocationCoordinates()` has built-in retry logic with exponential backoff for rate limit errors (429)
4. **Date Format Conversion**: `convertDateToISO()` in sheets.service handles MM/DD/YYYY format from sheets and converts to YYYY-MM-DD

## Status System

Six valid status values mapped to marker colors:
- **Prospect** → Blue (#4285F4) - Default status for new locations
- **Customer** → Green (#34A853)
- **Follow-up** → Yellow (#FBBC04)
- **Not interested** → Red (#EA4335)
- **Revisit** → Orange (#FF6D00)
- **Location not found** → Gray (#9E9E9E)
- **Follow-up Date Match** → Purple (#9C27B0) - Special highlighting when selectedFollowUpDate matches location.followUpDate

Status validation is enforced in:
- `src/types/location.ts` - Type guards (`isValidStatus()`)
- `src/services/sheets.service.ts` - Server-side validation before updates
- `src/lib/constants.ts` - Central status definitions

## Component Architecture

### Map Component (`src/components/Map.tsx`)
- Uses `useRef` for map instance, markers map, and initialization flag
- **Critical**: `isInitializedRef` prevents double-initialization of Google Maps
- Markers stored in `markersRef` (globalThis.Map<number, google.maps.Marker>)
- Three main useEffect hooks:
  1. Initialize map (runs once)
  2. Update markers when locations change
  3. Highlight selected marker and pan to it
- **Bounds Behavior**: Only fits bounds on initial load (`hasSetInitialBoundsRef`), not on subsequent updates

### LocationMarker Component (`src/components/LocationMarker.tsx`)
Client-side InfoWindow with inline editing for status, notes, and follow-up date. Implements optimistic updates with error rollback.

### Main Page (`src/app/page.tsx`)
Lifts state for locations, selected location, and user location. Handles data fetching and coordinates interactions between Map and LocationMarker.

## TypeScript Conventions

**Strict Mode Enabled**: All code must pass strict type checking
- NO `any` types - use `unknown` with type guards
- Explicit return types on all functions
- `interface` for extendable object shapes, `type` for unions/utilities

**Path Aliases**: `@/*` maps to `src/*` (configured in tsconfig.json)

**Type Organization**:
- `src/types/location.ts` - Location, LocationStatus, LocationUpdate
- `src/types/api.ts` - API request/response types
- `src/types/sheets.ts` - Google Sheets-specific types
- `src/types/google.ts` - Google Maps type extensions

## Mobile-First Design

### Critical Mobile Patterns
- Always write mobile styles first, then use `md:`, `lg:` breakpoints
- All touch targets must be ≥44x44px (iOS guidelines)
- Use `touch-manipulation` class to disable double-tap zoom
- InfoWindow centers on screen (not anchored to marker) for mobile usability
- "Get Directions" button detects iOS/Android and opens native maps app

### Responsive Breakpoints
- (default): 0px - Mobile phones
- `sm:`: 640px - Large phones
- `md:`: 768px - Tablets
- `lg:`: 1024px - Desktops

## API Routes

### GET /api/locations
Returns all locations from Google Sheets. Automatically geocodes missing coordinates in batches.

**Response Format**:
```typescript
{
  locations: Location[]
}
```

### PATCH /api/locations/[id]
Updates status, notes, and/or followUpDate for a single location.

**Request Body**:
```typescript
{
  status?: LocationStatus;
  notes?: string;
  followUpDate?: string; // YYYY-MM-DD format
}
```

**Response Format**:
```typescript
{
  success: true,
  location: Location
}
```

### Error Responses
All API errors return:
```typescript
{
  success: false,
  error: string,
  details?: string,
  statusCode: number
}
```

## Environment Variables

### Required (Server-Side)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email for Sheets API
- `GOOGLE_PRIVATE_KEY` - Service account private key (with newlines)
- `SHEET_ID` - Google Sheet ID from URL
- `SHEET_NAME` - Tab name (default: "Sheet1")
- `PUSHER_APP_ID` - Pusher application ID for real-time push notifications
- `PUSHER_SECRET` - Pusher application secret key

### Required (Client-Side)
- `NEXT_PUBLIC_MAPS_API_KEY` - Google Maps JavaScript API key
- `NEXT_PUBLIC_PUSHER_KEY` - Pusher application key (public)
- `NEXT_PUBLIC_PUSHER_CLUSTER` - Pusher cluster (e.g., "us2", "eu", "ap1")

### Optional
- `NEXT_PUBLIC_DEFAULT_MAP_CENTER` - Format: "lat,lng" (default: NYC)
- `NEXT_PUBLIC_DEFAULT_MAP_ZOOM` - Number 1-20 (default: 10)
- `DEBUG_MODE` - Enable verbose logging

**Important**:
- Service account must have Editor access to the Google Sheet
- API key must have Maps JavaScript API and Geocoding API enabled
- Pusher credentials can be obtained from [pusher.com/channels](https://pusher.com/channels) (free tier available)

## Common Development Tasks

### Adding a New Location Status
1. Update `LOCATION_STATUSES` array in `src/types/location.ts`
2. Add color mapping in `STATUS_COLORS` in `src/lib/constants.ts`
3. Update `STATUS_LABELS` if display name differs
4. No backend changes needed - Google Sheets accepts any string

### Modifying Sheet Structure
1. Update `SHEET_COLUMNS` mapping in `src/lib/constants.ts`
2. Update `SHEET_HEADERS` array
3. Modify `parseSheetRow()` in `src/services/sheets.service.ts`
4. Update `Location` interface in `src/types/location.ts`
5. Update API route handlers to support new fields

### Debugging Geocoding Issues
- Check browser console and server logs for `[API]` and `[BACKGROUND]` prefixed messages
- Geocoding runs in batches of 3 with 1-second delays
- Rate limit errors trigger exponential backoff (1s, 2s, 4s, 8s, 16s)
- Suspicious coordinates (near 0,0) are logged but not saved

## Code Quality Standards

From `docs/CODING_STANDARDS.md`:
- All functions must have explicit return types
- All exported functions need JSDoc comments with @param and @returns
- Use named exports (default exports only for Next.js pages)
- Follow file structure: 'use client' → imports → types → constants → component
- Error handling: All async operations in try-catch with user-friendly messages

## Testing Strategy

**Priority 1** (must test): API routes, service layer functions, type guards
**Priority 2** (should test): Complex React components with business logic
**Priority 3** (nice to have): Simple presentational components

Test files should be adjacent to source files with `.test.ts` or `.test.tsx` extension.

## Known Gotchas

1. **Google Maps Double Initialization**: Always check `isInitializedRef.current` before initializing to prevent errors
2. **Sheet Row Numbers**: Location ID is 1-indexed (row 2 = id 2), but parseSheetRow receives 0-indexed rowIndex
3. **Coordinate Validation**: 0,0 coordinates are treated as missing and will trigger geocoding
4. **Rate Limiting**: Google Sheets API has quota limits - the app implements batching and retries but large datasets may hit limits
5. **InfoWindow State**: Only one InfoWindow can be open at a time (controlled by selectedLocationId state)
6. **Follow-up Date Format**: Sheet may contain MM/DD/YYYY but app converts to YYYY-MM-DD for internal use

## Performance Considerations

- Map markers are recreated (not updated) when location data changes - this is intentional for simplicity
- Geocoding is intentionally slow (batched, rate-limited) to avoid API quota issues
- No real-time sync - users must refresh to see changes from other sources
- Client-side location filtering would require fetching all locations (currently server-rendered)

## Deployment Notes

When deploying to Vercel:
1. Set all environment variables in Vercel dashboard (Project > Settings > Environment Variables)
2. Update Google Cloud Console API key restrictions to include Vercel domain: `https://*.vercel.app/*`
3. Ensure service account has Editor access to the Google Sheet
4. First deploy may take longer due to Next.js optimization

## Related Documentation

- **Setup Guide**: `docs/SETUP.md` - Complete setup from scratch
- **Coding Standards**: `docs/CODING_STANDARDS.md` - Detailed development guidelines
- **Testing Checklist**: `docs/TESTING_CHECKLIST.md` - QA procedures
- **Architecture Plan**: `PLAN.md` - Original project architecture
- **README**: `README.md` - User-facing documentation
