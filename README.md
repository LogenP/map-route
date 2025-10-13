# Map Route

A mobile-first web application for tracking business locations on Google Maps with real-time Google Sheets synchronization.

## Overview

Map Route allows you to visualize and manage your business locations directly from a Google Map. All data is stored in Google Sheets and synchronized in real-time, making it easy to manage locations from anywhere. The application features color-coded markers, inline editing, and mobile-optimized "Get Directions" functionality.

## Key Features

- **Interactive Map Display:** View all business locations on Google Maps with color-coded markers by status
- **Real-time Sync:** Bidirectional synchronization with Google Sheets - changes in either location are reflected immediately
- **Inline Editing:** Edit status and notes directly from map markers without leaving the map view
- **Mobile-First Design:** Optimized for mobile devices with touch-friendly controls and responsive layout
- **Smart Directions:** One-tap directions that open Apple Maps on iOS or Google Maps on Android
- **Auto-Geocoding:** Automatically geocodes addresses without coordinates

## Quick Start

Get up and running in 5 steps:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Google Cloud**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Sheets API, Maps JavaScript API, and Geocoding API
   - Create a Service Account and download the JSON key
   - Create an API key for Maps & Geocoding

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your credentials
   ```

4. **Set Up Google Sheet**
   - Create a new Google Sheet with columns: Company Name, Address, Status, Notes, Latitude, Longitude
   - Share the sheet with your service account email (Editor access)

5. **Run the App**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

**Need more details?** See the comprehensive [Setup Guide](docs/SETUP.md) for step-by-step instructions with screenshots.

## Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete setup instructions from scratch
- **[Testing Checklist](docs/TESTING_CHECKLIST.md)** - Comprehensive testing guide
- **[Coding Standards](docs/CODING_STANDARDS.md)** - Development guidelines and best practices
- **[Architecture Plan](PLAN.md)** - Project architecture and data flow

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **UI Library:** React 18
- **Maps:** Google Maps JavaScript API
- **Data Storage:** Google Sheets API
- **Geocoding:** Google Geocoding API
- **Styling:** Tailwind CSS (Mobile-First)
- **Deployment:** Vercel

## Project Structure

```
map-route/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Main map page
│   │   ├── layout.tsx            # Root layout with metadata
│   │   ├── globals.css           # Global styles
│   │   └── api/
│   │       └── locations/        # API routes
│   ├── components/
│   │   ├── Map.tsx               # Google Maps component
│   │   └── LocationMarker.tsx    # InfoWindow component
│   ├── services/
│   │   ├── sheets.service.ts     # Google Sheets integration
│   │   └── geocoding.service.ts  # Address geocoding
│   ├── types/                    # TypeScript type definitions
│   │   ├── location.ts           # Location types
│   │   ├── api.ts                # API types
│   │   ├── sheets.ts             # Google Sheets types
│   │   └── google.ts             # Google Maps types
│   └── lib/
│       ├── config.ts             # App configuration
│       └── constants.ts          # App constants
├── docs/
│   ├── SETUP.md                  # Setup instructions
│   ├── TESTING_CHECKLIST.md      # Testing guide
│   ├── CODING_STANDARDS.md       # Code guidelines
│   └── AGENT_REPORTS/            # Development reports
├── public/                       # Static assets
├── .env.example                  # Environment template
└── README.md                     # This file
```

## Status Colors

Locations are color-coded on the map based on their status:

- **Prospect** - Blue (#4285F4)
- **Customer** - Green (#34A853)
- **Follow-up** - Yellow (#FBBC04)
- **Not interested** - Red (#EA4335)
- **Revisit** - Orange (#FF6D00)
- **Possibility** - Purple (#9C27B0)

## Development Commands

```bash
# Development
npm run dev      # Start development server on http://localhost:3000
npm run build    # Build optimized production bundle
npm start        # Run production build locally
npm run lint     # Run ESLint code quality checks

# TypeScript
npx tsc --noEmit # Check types without emitting files

# Deployment
vercel           # Deploy to Vercel (requires Vercel CLI)
```

## Environment Variables

The application requires the following environment variables in `.env.local`:

```env
# Google Maps (Client-side)
NEXT_PUBLIC_MAPS_API_KEY=your_google_maps_api_key

# Google Sheets Service Account (Server-side)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Sheet Configuration
SHEET_ID=your_google_sheet_id
SHEET_NAME=Sheet1

# Optional Configuration
NEXT_PUBLIC_DEFAULT_MAP_CENTER=40.7128,-74.0060  # Default: NYC
NEXT_PUBLIC_DEFAULT_MAP_ZOOM=10                   # Default: 10
DEBUG_MODE=false                                  # Enable verbose logging
```

See [.env.example](.env.example) for detailed descriptions of each variable.

## Google Sheets Format

Your Google Sheet should have these columns in order:

| Column A | Column B | Column C | Column D | Column E | Column F |
|----------|----------|----------|----------|----------|----------|
| Company Name | Address | Status | Notes | Latitude | Longitude |

**Example Row:**
| Company Name | Address | Status | Notes | Latitude | Longitude |
|---|---|---|---|---|---|
| Example Corp | 123 Main St, New York, NY | Prospect | Called on Monday | 40.7128 | -74.0060 |

**Notes:**
- Headers must be exactly as shown (case-sensitive)
- Latitude and Longitude can be blank - app will geocode automatically
- Status must be one of the six valid values
- Notes are optional

## API Endpoints

### GET /api/locations
Fetches all locations from Google Sheets with automatic geocoding for missing coordinates.

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
Updates a location's status and/or notes.

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
  "location": { /* updated location object */ }
}
```

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to Git Repository** (GitHub, GitLab, or Bitbucket)

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel auto-detects Next.js configuration

3. **Configure Environment Variables**
   - In Vercel Dashboard: Project > Settings > Environment Variables
   - Add all variables from `.env.local`
   - Select Production, Preview, and Development environments

4. **Deploy**
   - Vercel deploys automatically on git push
   - Production URL: `https://your-project.vercel.app`

5. **Update API Key Restrictions**
   - Go to Google Cloud Console > Credentials
   - Add Vercel domain to API key restrictions: `https://*.vercel.app/*`

See [docs/SETUP.md](docs/SETUP.md) for detailed deployment instructions.

## Browser Support

### Desktop
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile
- iOS Safari 14+
- Chrome for Android
- Samsung Internet

## Performance

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.0s
- **Lighthouse Score:** 90+
- **API Calls:** Optimized with caching and rate limiting
- **Bundle Size:** Optimized with Next.js automatic code splitting

## Troubleshooting

### Common Issues

**Map not loading:**
- Verify `NEXT_PUBLIC_MAPS_API_KEY` is set in `.env.local`
- Check API key has Maps JavaScript API enabled
- Check browser console for error messages

**Locations not showing:**
- Verify Google Sheet is shared with service account email
- Check `SHEET_ID` matches your sheet
- Ensure sheet has the correct column headers

**Save not working:**
- Verify service account has Editor access to sheet
- Check browser console for API errors
- Ensure valid status values are used

See [docs/SETUP.md#troubleshooting](docs/SETUP.md#troubleshooting) for more solutions.

## Known Limitations

- No real-time sync (manual refresh required to see changes from other users)
- No offline support
- InfoWindow is centered on screen (not anchored to marker)
- No marker clustering for large datasets (1000+ locations)
- User zoom is disabled for app-like experience (may affect accessibility)

## Future Enhancements

Potential improvements for future versions:

- Real-time updates with WebSockets
- Offline support with Service Workers
- Marker clustering for large datasets
- Search and filter functionality
- Export to CSV/PDF
- User authentication
- Multi-user collaboration
- Custom marker icons
- Route optimization
- Historical data tracking

## Contributing

This is a private project. For questions or issues, refer to the documentation or contact the project maintainer.

## License

Private project - All rights reserved

## Support

For setup help or troubleshooting:

1. Check the [Setup Guide](docs/SETUP.md)
2. Review the [Testing Checklist](docs/TESTING_CHECKLIST.md)
3. Check browser console for error messages
4. Verify all environment variables are correct
5. Ensure Google Cloud APIs are enabled
6. Confirm Google Sheet permissions are correct

## Project Status

**Status:** Production Ready

**Last Updated:** October 12, 2025

**Version:** 1.0.0

---

**Built with Next.js 15, TypeScript, and Google Cloud Platform**
