# Map Route - Complete Setup Guide

This guide will walk you through setting up the Map Route application from scratch. The application displays business locations on Google Maps with real-time Google Sheets synchronization.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Setup](#google-cloud-setup)
3. [Google Sheets Setup](#google-sheets-setup)
4. [Project Installation](#project-installation)
5. [Environment Configuration](#environment-configuration)
6. [Running the Application](#running-the-application)
7. [Deployment to Vercel](#deployment-to-vercel)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** (v18 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`

- **npm** (comes with Node.js)
  - Verify installation: `npm --version`

- **Git** (optional, for version control)
  - Download from: https://git-scm.com/
  - Verify installation: `git --version`

### Required Accounts

- **Google Cloud Account**
  - Sign up at: https://console.cloud.google.com/
  - Credit card required (but free tier is sufficient for development)

- **Google Account**
  - For Google Sheets access
  - Can be the same account as Google Cloud

---

## Google Cloud Setup

Follow these steps carefully to set up Google Cloud services.

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter project name (e.g., "Map Route")
5. Click **"Create"**
6. Wait for the project to be created (usually takes a few seconds)
7. Ensure the new project is selected in the dropdown

### Step 2: Enable Required APIs

You need to enable three APIs for this project.

#### Enable Google Sheets API

1. In Google Cloud Console, go to **"APIs & Services" > "Library"**
2. Search for **"Google Sheets API"**
3. Click on it, then click **"Enable"**
4. Wait for enablement confirmation

#### Enable Maps JavaScript API

1. Return to **"APIs & Services" > "Library"**
2. Search for **"Maps JavaScript API"**
3. Click on it, then click **"Enable"**
4. Wait for enablement confirmation

#### Enable Geocoding API

1. Return to **"APIs & Services" > "Library"**
2. Search for **"Geocoding API"**
3. Click on it, then click **"Enable"**
4. Wait for enablement confirmation

### Step 3: Create Service Account (for Google Sheets)

1. Go to **"IAM & Admin" > "Service Accounts"**
2. Click **"Create Service Account"**
3. Enter details:
   - **Name:** `map-route-service`
   - **Description:** `Service account for Map Route app to access Google Sheets`
4. Click **"Create and Continue"**
5. **Grant this service account access to project:**
   - Skip this step, click **"Continue"**
6. **Grant users access to this service account:**
   - Skip this step, click **"Done"**

### Step 4: Create Service Account Key

1. Find your newly created service account in the list
2. Click on the service account email
3. Go to the **"Keys"** tab
4. Click **"Add Key" > "Create new key"**
5. Choose **JSON** format
6. Click **"Create"**
7. A JSON file will download automatically - **KEEP THIS FILE SAFE**
8. Open the file and note the following values:
   - `client_email` - This is your **Service Account Email**
   - `private_key` - This is your **Private Key** (including the `-----BEGIN` and `-----END` lines)

### Step 5: Create API Key (for Maps & Geocoding)

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"Create Credentials" > "API key"**
3. A new API key will be created
4. **IMPORTANT:** Click **"Restrict Key"** (do NOT skip this for production)
5. Under **"API restrictions":**
   - Select **"Restrict key"**
   - Check these APIs:
     - Maps JavaScript API
     - Geocoding API
6. Under **"Application restrictions"** (for production):
   - Select **"HTTP referrers (websites)"**
   - Add your production domain (e.g., `https://yourdomain.com/*`)
   - For development, you can leave this as **"None"** but **MUST restrict for production**
7. Click **"Save"**
8. Copy the API key - you'll need this for your `.env.local` file

---

## Google Sheets Setup

### Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Click **"Blank"** to create a new spreadsheet
3. Name your spreadsheet (e.g., "Map Route Locations")

### Step 2: Set Up Column Headers

In the first row, add these exact column headers:

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| Company Name | Address | Status | Notes | Latitude | Longitude |

**Notes:**
- Column order MUST match exactly as shown
- Header names MUST be exactly as shown (case-sensitive)
- The application expects these specific columns

### Step 3: Add Example Data (Optional)

Add a test row to verify everything works:

| Company Name | Address | Status | Notes | Latitude | Longitude |
|---|---|---|---|---|---|
| Example Corp | 123 Main St, New York, NY 10001 | Prospect | Test location | 40.7128 | -74.0060 |

**Valid Status Values:**
- `Prospect` - Blue marker
- `Customer` - Green marker
- `Follow-up` - Yellow marker
- `Not interested` - Red marker
- `Revisit` - Orange marker
- `Possibility` - Purple marker

**Important Notes:**
- Latitude and Longitude can be left blank - the app will geocode addresses automatically
- If geocoding fails, the location will be skipped
- Notes are optional

### Step 4: Share Sheet with Service Account

This is **CRITICAL** - the app cannot read your sheet without this step.

1. Click the **"Share"** button in the top-right corner
2. In the email field, paste your **Service Account Email**
   - This is the `client_email` from your downloaded JSON file
   - It looks like: `map-route-service@your-project.iam.gserviceaccount.com`
3. Set permission to **"Editor"**
4. **Uncheck** "Notify people"
5. Click **"Share"**

### Step 5: Get Sheet ID

1. Look at the URL of your Google Sheet
2. The URL looks like: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Copy the `{SHEET_ID}` part (long alphanumeric string)
4. Example: If URL is `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - Sheet ID is: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### Step 6: Note Sheet Name

1. Look at the tab name at the bottom of the sheet
2. Default is usually **"Sheet1"**
3. If you renamed it, note the exact name (case-sensitive)

---

## Project Installation

### Step 1: Download Project

If you haven't already, get the project files:

```bash
# Option 1: Clone from git (if available)
git clone <repository-url>
cd map-route

# Option 2: Extract from ZIP
# - Download and extract the project ZIP file
# - Open terminal/command prompt
# - Navigate to the extracted folder
cd "/path/to/Map Route"
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (may take 1-2 minutes).

**Expected output:**
```
added 393 packages, and audited 394 packages in 15s
```

If you see warnings about deprecated packages, that's normal and can be ignored.

---

## Environment Configuration

### Step 1: Create Environment File

```bash
# Copy the example file
cp .env.example .env.local
```

**Important:**
- Use `.env.local` (NOT `.env`)
- This file is gitignored and will NOT be committed
- Never share this file - it contains your secrets

### Step 2: Fill in Environment Variables

Open `.env.local` in a text editor and fill in these values:

```env
# ============================================
# GOOGLE MAPS API KEY (Public - Client Side)
# ============================================
# This key is used in the browser for Google Maps
# Get this from Google Cloud Console > APIs & Services > Credentials
NEXT_PUBLIC_MAPS_API_KEY=your_api_key_here

# ============================================
# GOOGLE SHEETS SERVICE ACCOUNT (Server Side)
# ============================================
# Service account email from the JSON key file
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Service account private key from the JSON key file
# IMPORTANT: Must include the full key with -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----
# If you get errors, ensure there are no extra quotes or escaped characters
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBA...your_full_private_key_here...
-----END PRIVATE KEY-----"

# ============================================
# GOOGLE SHEET CONFIGURATION
# ============================================
# The ID from your Google Sheet URL
SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# The name of the sheet tab (usually "Sheet1")
SHEET_NAME=Sheet1

# ============================================
# OPTIONAL CONFIGURATION
# ============================================
# Default map center (latitude,longitude)
# Default: New York City
NEXT_PUBLIC_DEFAULT_MAP_CENTER=40.7128,-74.0060

# Default map zoom level (1-20)
# Default: 10
NEXT_PUBLIC_DEFAULT_MAP_ZOOM=10

# Enable debug mode for detailed logs
# Default: false
DEBUG_MODE=false
```

### Step 3: Verify Configuration

Double-check these common issues:

#### API Key Issues
- ✅ **Correct:** `NEXT_PUBLIC_MAPS_API_KEY=AIzaSyD...` (no quotes)
- ❌ **Wrong:** `NEXT_PUBLIC_MAPS_API_KEY="AIzaSyD..."` (extra quotes)

#### Service Account Email
- ✅ **Correct:** Ends with `.iam.gserviceaccount.com`
- ❌ **Wrong:** Using your personal email

#### Private Key Format
- ✅ **Correct:** Wrapped in double quotes, includes BEGIN/END lines
- ❌ **Wrong:** Missing quotes, missing BEGIN/END lines, has extra backslashes

#### Sheet ID
- ✅ **Correct:** Long alphanumeric string (28-44 characters)
- ❌ **Wrong:** Full URL or shortened ID

---

## Running the Application

### Development Mode

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 15.0.3
- Local:        http://localhost:3000
- Ready in 1.2s
```

**What to expect:**
1. Server starts on http://localhost:3000
2. Open browser to http://localhost:3000
3. You should see a loading spinner
4. Map should load with your locations
5. Click markers to see location details

### Build for Production

```bash
npm run build
```

This compiles the application for production. Look for:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (5/5)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB        95.3 kB
└ ○ /api/locations                       0 B            0 B
```

### Run Production Build Locally

```bash
npm run build
npm start
```

This runs the optimized production build on http://localhost:3000.

---

## Deployment to Vercel

Vercel is the recommended deployment platform for Next.js applications.

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub, GitLab, or Bitbucket
3. No credit card required for free tier

### Step 2: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 3: Deploy via Vercel Dashboard

#### Option A: Deploy from Git (Recommended)

1. Push your project to GitHub/GitLab/Bitbucket
2. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
3. Click **"Add New" > "Project"**
4. **Import** your Git repository
5. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `.next` (auto-filled)
6. Click **"Deploy"**

#### Option B: Deploy via CLI

```bash
cd "/path/to/Map Route"
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **map-route** (or your choice)
- Directory? `./` (Enter)
- Detected Next.js. Override? **N**
- Deploy? **Y**

### Step 4: Configure Environment Variables in Vercel

**CRITICAL:** Your environment variables are NOT deployed automatically.

1. In Vercel Dashboard, go to your project
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in sidebar
4. Add each variable:
   - Name: `NEXT_PUBLIC_MAPS_API_KEY`
   - Value: `your_api_key_here`
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **"Save"**

Repeat for ALL environment variables:
- `NEXT_PUBLIC_MAPS_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY` (paste entire key including BEGIN/END lines)
- `SHEET_ID`
- `SHEET_NAME`
- `NEXT_PUBLIC_DEFAULT_MAP_CENTER` (optional)
- `NEXT_PUBLIC_DEFAULT_MAP_ZOOM` (optional)

**Important:**
- Click **"Save"** after each variable
- Ensure **Production** is selected
- For `GOOGLE_PRIVATE_KEY`, paste the full multi-line key

### Step 5: Redeploy

After adding environment variables:

1. Go to **"Deployments"** tab
2. Click **"..." menu** on the latest deployment
3. Click **"Redeploy"**
4. Check **"Use existing Build Cache"** (optional)
5. Click **"Redeploy"**

### Step 6: Update Google Cloud API Restrictions

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Click on your API key
3. Under **"Application restrictions":**
   - Select **"HTTP referrers (websites)"**
   - Click **"Add an item"**
   - Add: `https://*.vercel.app/*`
   - Add: `https://yourdomain.com/*` (if using custom domain)
4. Click **"Save"**

### Step 7: Verify Deployment

1. Open your Vercel deployment URL (e.g., `https://map-route.vercel.app`)
2. Map should load with locations
3. Test marker clicks and editing

---

## Troubleshooting

### Issue 1: "Missing required environment variable: NEXT_PUBLIC_MAPS_API_KEY"

**Cause:** Environment variable not set or not accessible.

**Solutions:**
1. Check `.env.local` file exists in project root
2. Ensure variable name is exactly `NEXT_PUBLIC_MAPS_API_KEY`
3. Restart dev server: Stop with Ctrl+C, run `npm run dev` again
4. Check for typos or extra spaces in `.env.local`

### Issue 2: "Failed to load locations" or Map shows error

**Causes:** API key issues, service account issues, or sheet access issues.

**Solutions:**

#### Check API Key
```bash
# In browser console
console.log(process.env.NEXT_PUBLIC_MAPS_API_KEY)
```
- Should show your API key
- If `undefined`, restart dev server

#### Check Service Account Access
1. Go to your Google Sheet
2. Click **"Share"**
3. Verify service account email is listed with **"Editor"** access
4. If not, add it again

#### Check Sheet ID
1. Verify `SHEET_ID` in `.env.local` matches URL
2. No extra quotes or spaces
3. Should be 28-44 characters long

#### Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for error messages
4. Common errors:
   - `401` - Authentication failed (check service account)
   - `403` - Permission denied (share sheet with service account)
   - `404` - Sheet not found (check SHEET_ID)

### Issue 3: "Permission denied" or 403 errors

**Cause:** Service account doesn't have access to sheet.

**Solution:**
1. Copy service account email from `.env.local`
2. Go to Google Sheet
3. Click **"Share"**
4. Paste service account email
5. Set to **"Editor"**
6. Click **"Share"** (don't notify)

### Issue 4: Geocoding not working

**Symptoms:** Locations with addresses but no lat/lng not showing on map.

**Causes:**
- Geocoding API not enabled
- API key doesn't have Geocoding API access
- Invalid addresses
- Geocoding API quota exceeded

**Solutions:**
1. Verify Geocoding API is enabled in Google Cloud Console
2. Check API key restrictions allow Geocoding API
3. Check browser console for geocoding errors
4. Verify addresses are complete and valid
5. Check Google Cloud Console for API usage/quotas

### Issue 5: Map not loading or blank screen

**Common causes:**

#### API Key Restrictions
- Go to Google Cloud Console > Credentials
- Click your API key
- Check **"Application restrictions"** allows your domain/localhost

#### Missing Libraries
- Check browser console for "Google Maps failed to load"
- Verify Maps JavaScript API is enabled in Google Cloud Console

#### Browser Console Errors
- Open DevTools (F12)
- Check Console for error messages
- Common fixes:
  - Clear browser cache
  - Try incognito/private window
  - Check API key is correct

### Issue 6: Markers showing wrong colors

**Cause:** Invalid status values in Google Sheet.

**Valid values (case-sensitive):**
- `Prospect`
- `Customer`
- `Follow-up`
- `Not interested`
- `Revisit`
- `Possibility`

**Solution:**
1. Check status column in Google Sheet
2. Fix any typos or invalid values
3. Refresh the app

### Issue 7: Build fails on Vercel

**Common causes:**

#### Missing Environment Variables
- Go to Vercel project > Settings > Environment Variables
- Ensure all variables are added
- Redeploy after adding variables

#### Build Error Messages
- Check Vercel build logs
- Common issues:
  - TypeScript errors - run `npx tsc --noEmit` locally
  - Missing dependencies - run `npm install` locally
  - Environment variable format - check for extra quotes/spaces

### Issue 8: Private key format errors

**Error:** `error:0909006C:PEM routines:get_name:no start line`

**Cause:** Private key format is incorrect.

**Solution:**
1. Open your downloaded JSON key file
2. Find the `private_key` field
3. Copy the ENTIRE value including quotes
4. In `.env.local`, paste it like this:

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...rest_of_key...\n-----END PRIVATE KEY-----\n"
```

**Important:**
- Keep the double quotes
- Keep the `\n` characters (they represent newlines)
- Don't add extra spaces or line breaks

### Issue 9: CORS errors

**Cause:** API key restrictions blocking requests from your domain.

**Solution:**
1. Go to Google Cloud Console > Credentials
2. Click your API key
3. Under **"Application restrictions":**
   - For development: Set to **"None"** temporarily
   - For production: Add your domain to **"HTTP referrers"**
4. Click **"Save"**
5. Wait 5 minutes for changes to propagate
6. Refresh your app

### Issue 10: Too many locations not showing

**Causes:**
- Some locations have invalid coordinates
- Geocoding failed for addresses
- Data formatting issues

**Solutions:**
1. Check browser console for warnings about skipped locations
2. Verify lat/lng values are numbers (not text)
3. For missing coordinates, app should auto-geocode
4. Check geocoding API quota in Google Cloud Console

---

## Getting Help

### Check Logs

**Development:**
```bash
# Terminal logs show server-side errors
npm run dev

# Browser console (F12) shows client-side errors
```

**Production (Vercel):**
1. Go to Vercel Dashboard
2. Click your project
3. Click **"Logs"** tab
4. Filter by timeframe and function

### Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **Google Cloud Documentation:** https://cloud.google.com/docs
- **Google Sheets API:** https://developers.google.com/sheets/api
- **Google Maps API:** https://developers.google.com/maps/documentation

### Common Commands Reference

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm start                  # Run production build
npm run lint               # Check code quality
npx tsc --noEmit          # Check TypeScript

# Vercel
vercel                     # Deploy to Vercel
vercel --prod             # Deploy to production
vercel logs               # View deployment logs

# Debugging
npm install                # Reinstall dependencies
rm -rf .next              # Clear Next.js cache
rm -rf node_modules       # Remove all dependencies
npm install                # Reinstall everything
```

---

## Next Steps

Once everything is working:

1. **Add your real data** to Google Sheet
2. **Test all functionality** (see TESTING_CHECKLIST.md)
3. **Deploy to production** on Vercel
4. **Set up custom domain** (optional, in Vercel settings)
5. **Monitor usage** in Google Cloud Console
6. **Set up billing alerts** to avoid unexpected charges

---

## Security Best Practices

1. **Never commit** `.env.local` to git
2. **Restrict API keys** to specific domains in production
3. **Rotate keys** periodically (every 90 days recommended)
4. **Monitor usage** for unexpected spikes
5. **Enable** billing alerts in Google Cloud Console
6. **Use** different API keys for development and production
7. **Review** service account permissions regularly

---

## Support

For issues not covered in this guide:

1. Check browser console for error messages
2. Check server logs for backend errors
3. Verify all environment variables are correct
4. Try clearing cache and restarting server
5. Review Google Cloud API quotas and restrictions

---

**Setup complete!** You should now have a fully functional Map Route application.
