# Map Route - Project Architecture Plan

## Project Overview
A mobile-first web application for tracking business locations on a map with real-time Google Sheets synchronization.

## Core Features
- Display locations on Google Maps with color-coded markers by status
- Sync data bidirectionally with Google Sheets
- Edit status and notes directly from map markers
- Mobile-optimized interface
- "Get Directions" integration with Apple Maps (iOS) / Google Maps (Android)

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Maps:** Google Maps JavaScript API
- **Data Source:** Google Sheets API
- **Geocoding:** Google Geocoding API
- **Deployment:** Vercel
- **Styling:** Tailwind CSS (mobile-first)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Map         │  │  InfoWindow  │  │  Mobile      │      │
│  │  Component   │  │  Component   │  │  Layout      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Routes    │
                    │  (Next.js API)  │
                    └────────┬────────┘
                             │
            ┌────────────────┴────────────────┐
            │                                 │
   ┌────────▼────────┐            ┌──────────▼──────────┐
   │  Google Sheets  │            │    Geocoding        │
   │     Service     │            │     Service         │
   └─────────────────┘            └─────────────────────┘
            │                                 │
   ┌────────▼────────┐            ┌──────────▼──────────┐
   │ Google Sheets   │            │   Google Geocoding  │
   │      API        │            │       API           │
   └─────────────────┘            └─────────────────────┘
```

## Project Structure

```
map-route/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Main map page
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   └── api/
│   │       ├── locations/
│   │       │   └── route.ts         # GET locations from Sheets
│   │       └── locations/[id]/
│   │           └── route.ts         # PATCH update location
│   ├── components/
│   │   ├── Map.tsx                  # Google Maps component
│   │   ├── LocationMarker.tsx       # Individual marker with InfoWindow
│   │   └── LoadingSpinner.tsx       # Loading state component
│   ├── services/
│   │   ├── sheets.service.ts        # Google Sheets read/write
│   │   └── geocoding.service.ts     # Address to coordinates
│   ├── types/
│   │   ├── location.ts              # Location interface
│   │   └── api.ts                   # API response types
│   ├── lib/
│   │   ├── config.ts                # App configuration
│   │   └── constants.ts             # Status colors, etc.
│   └── utils/
│       └── helpers.ts               # Utility functions
├── public/
│   └── favicon.ico
├── docs/
│   ├── AGENT_REPORTS/               # Agent deliverable reports
│   ├── CODING_STANDARDS.md          # Coding standards for all agents
│   └── SETUP.md                     # User setup instructions
├── .env.local                       # Environment variables (not committed)
├── .env.example                     # Example env file
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Google Sheets Structure

| Company Name | Address | Status | Notes | Latitude | Longitude |
|--------------|---------|--------|-------|----------|-----------|
| Example Corp | 123 Main St | Prospect | Called them... | 40.7128 | -74.0060 |

**Status Options:**
- Prospect → Blue marker
- Customer → Green marker
- Follow-up → Yellow marker
- Not interested → Red marker
- Revisit → Orange marker
- Possibility → Purple marker

## Data Flow

### 1. Loading Locations
```
User opens app → GET /api/locations → Sheets Service reads from Google Sheets
→ Check for missing lat/lng → Geocoding Service converts addresses
→ Update Sheet with coordinates → Return locations to frontend → Render markers
```

### 2. Updating Location
```
User edits status/notes → PATCH /api/locations/[id] → Sheets Service updates row
→ Return updated location → Update marker in real-time
```

## API Contracts

### GET /api/locations
**Response:**
```json
{
  "locations": [
    {
      "id": 1,
      "companyName": "Example Corp",
      "address": "123 Main St, New York, NY",
      "status": "Prospect",
      "notes": "Called them on Monday",
      "lat": 40.7128,
      "lng": -74.0060
    }
  ]
}
```

### PATCH /api/locations/[id]
**Request:**
```json
{
  "status": "Customer",
  "notes": "Signed contract!"
}
```

**Response:**
```json
{
  "success": true,
  "location": { /* updated location */ }
}
```

## Environment Variables

```env
# Google Cloud
GOOGLE_MAPS_API_KEY=your_maps_api_key
GOOGLE_SHEETS_API_KEY=your_sheets_api_key
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key

# Google Sheets
SHEET_ID=your_google_sheet_id
SHEET_NAME=Sheet1

# App Config
NEXT_PUBLIC_MAPS_API_KEY=your_maps_api_key
```

## Agent Implementation Phases

### Phase 1: Foundation (Parallel)
1. **Project Setup Agent** - Next.js scaffolding, dependencies
2. **Coding Standards Agent** - CODING_STANDARDS.md
3. **Type Definitions Agent** - TypeScript interfaces
4. **Config & Environment Agent** - .env.example, constants

### Phase 2: Backend Services (Parallel)
5. **Google Sheets Service Agent** - sheets.service.ts
6. **Geocoding Service Agent** - geocoding.service.ts
7. **API Routes Agent** - /api/locations endpoints

### Phase 3: Frontend Components (Parallel)
8. **Map Component Agent** - Map.tsx with Google Maps
9. **InfoWindow & Interaction Agent** - LocationMarker.tsx with edit functionality
10. **Mobile Layout Agent** - page.tsx, responsive design, "Get Directions"

### Phase 4: Integration
11. **Integration & Testing Agent** - Connect all pieces, end-to-end test, SETUP.md

## Success Criteria
- ✅ Mobile-first responsive design
- ✅ All locations displayed on map with correct colors
- ✅ Click marker to edit status/notes
- ✅ Changes sync to Google Sheets
- ✅ "Get Directions" opens Apple Maps on iOS
- ✅ Handles missing/invalid addresses gracefully
- ✅ Loading states for all async operations
- ✅ Clear setup documentation

## Non-Functional Requirements
- Simple, clean code
- Comprehensive inline documentation
- Error handling for all API calls
- Mobile-optimized UI (touch-friendly)
- Fast load times (<3s)
- Works on iOS Safari and Chrome

## Future Enhancements (Not in Scope)
- Authentication
- Real-time sync without refresh
- Filtering by status
- Search functionality
- Export features
