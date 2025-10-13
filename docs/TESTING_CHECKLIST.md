# Map Route - Testing Checklist

This document provides a comprehensive testing checklist for the Map Route application. Follow these steps to ensure all functionality works correctly before deploying to production.

---

## Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Initial Load Testing](#initial-load-testing)
3. [Map Functionality Testing](#map-functionality-testing)
4. [Location Interaction Testing](#location-interaction-testing)
5. [InfoWindow Testing](#infowindow-testing)
6. [Data Update Testing](#data-update-testing)
7. [Mobile Testing](#mobile-testing)
8. [Error Handling Testing](#error-handling-testing)
9. [Performance Testing](#performance-testing)
10. [Browser Compatibility Testing](#browser-compatibility-testing)
11. [Deployment Testing](#deployment-testing)

---

## Pre-Testing Setup

### Prerequisites

Before testing, ensure:

- [ ] `.env.local` file is configured with valid credentials
- [ ] Google Sheet has at least 3-5 test locations
- [ ] Service account has Editor access to the sheet
- [ ] All APIs are enabled in Google Cloud Console
- [ ] Development server is running (`npm run dev`)

### Test Data Setup

Create test locations in your Google Sheet with various statuses:

| Company Name | Address | Status | Notes | Latitude | Longitude |
|---|---|---|---|---|---|
| Test Location 1 | 350 5th Ave, New York, NY 10118 | Prospect | Empire State Building | 40.7484 | -73.9857 |
| Test Location 2 | 1600 Amphitheatre Parkway, Mountain View, CA | Customer | Google HQ | 37.4220 | -122.0841 |
| Test Location 3 | 1 Apple Park Way, Cupertino, CA | Follow-up | Apple HQ | 37.3348 | -122.0090 |
| Test Location 4 | 123 Main St, New York, NY | Revisit | Test address with geocoding | | |
| Test Location 5 | Invalid Address XYZ | Not interested | Should be skipped | | |

---

## Initial Load Testing

### Application Startup

- [ ] Open browser to http://localhost:3000
- [ ] Loading spinner appears immediately
- [ ] No console errors in browser DevTools (F12)
- [ ] Loading text says "Loading locations..."
- [ ] Loading spinner is animated (rotating)

### Data Loading

- [ ] Map loads within 2-3 seconds
- [ ] All valid locations appear as markers on map
- [ ] Markers are color-coded correctly by status:
  - [ ] Prospect = Blue
  - [ ] Customer = Green
  - [ ] Follow-up = Yellow
  - [ ] Not interested = Red
  - [ ] Revisit = Orange
  - [ ] Possibility = Purple
- [ ] Map automatically zooms to show all markers
- [ ] Invalid locations are skipped (check console for warnings)

### Console Logs

Open browser DevTools (F12) and check Console tab:

- [ ] No red errors appear
- [ ] Success message: `Successfully loaded X locations`
- [ ] Warning for invalid locations (if any): `Skipping location with invalid coordinates`
- [ ] Geocoding messages for locations without coordinates

---

## Map Functionality Testing

### Map Controls

- [ ] Zoom in button works (+)
- [ ] Zoom out button works (-)
- [ ] Fullscreen button works (expands map)
- [ ] Map can be dragged/panned with mouse
- [ ] Double-click zooms in
- [ ] Scroll wheel zooms in/out (if enabled)

### Map Rendering

- [ ] Map tiles load correctly
- [ ] No broken images or missing tiles
- [ ] Street names are visible
- [ ] Map style is clean (POI labels hidden)
- [ ] All markers are visible and not overlapping text

### Marker Display

- [ ] All markers are visible on the map
- [ ] Marker icons are properly sized
- [ ] Marker colors match status colors
- [ ] Markers have white borders
- [ ] Markers appear at correct locations

---

## Location Interaction Testing

### Marker Click

- [ ] Clicking a marker opens InfoWindow
- [ ] Clicked marker scales up slightly (highlighted)
- [ ] Map pans to center on selected marker
- [ ] Only one InfoWindow is open at a time
- [ ] InfoWindow appears centered on screen

### InfoWindow Display

- [ ] Company name displays correctly
- [ ] Full address displays correctly
- [ ] Current status displays in dropdown
- [ ] Notes display in textarea (if any)
- [ ] Character counter shows correct count
- [ ] "Get Directions" button is visible
- [ ] "Close" button (X) is visible
- [ ] InfoWindow has white background
- [ ] InfoWindow has shadow/elevation
- [ ] Text is readable and properly formatted

### Close InfoWindow

- [ ] Clicking X button closes InfoWindow
- [ ] Marker returns to normal size
- [ ] Can click same marker again to reopen
- [ ] Clicking different marker switches InfoWindow
- [ ] No InfoWindow visible when none selected

---

## InfoWindow Testing

### Status Dropdown

- [ ] Dropdown shows all 6 status options
- [ ] Current status is pre-selected
- [ ] Can change status by clicking dropdown
- [ ] Changing status enables Save button
- [ ] Dropdown options are in correct order

### Notes Editing

- [ ] Can click in notes textarea to edit
- [ ] Can type new text
- [ ] Can delete existing text
- [ ] Can use Enter key for new lines
- [ ] Character counter updates in real-time
- [ ] Shows format: `X / 500 characters`
- [ ] Typing enables Save button

### Validation

- [ ] Typing more than 500 characters shows error
- [ ] Error message appears below textarea
- [ ] Error message is red
- [ ] Save button is disabled when over 500 characters
- [ ] Deleting characters removes error when under 500
- [ ] Save button is disabled when no changes made

### Save Functionality

- [ ] Save button is disabled initially
- [ ] Save button enables after making changes
- [ ] Clicking Save shows loading spinner
- [ ] Save button text changes to "Saving..."
- [ ] Save button is disabled during save
- [ ] Success message appears after save (green)
- [ ] Success message says "Location updated successfully!"
- [ ] Marker color changes if status was changed
- [ ] Success message auto-dismisses after 2 seconds

### Cancel Functionality

- [ ] Cancel button is visible
- [ ] Clicking Cancel reverts changes
- [ ] Status returns to original value
- [ ] Notes return to original value
- [ ] Save button becomes disabled after cancel
- [ ] Cancel button is disabled during save

### Get Directions

- [ ] "Get Directions" button is visible
- [ ] Button has location pin icon
- [ ] Clicking button opens new window/tab
- [ ] On desktop: Opens Google Maps web
- [ ] URL includes correct coordinates
- [ ] Directions show correct destination

---

## Data Update Testing

### Update Flow

- [ ] Make changes to status and notes
- [ ] Click Save
- [ ] Changes save successfully
- [ ] InfoWindow still shows updated data
- [ ] Close InfoWindow
- [ ] Reopen same marker
- [ ] Changes are persisted
- [ ] Refresh page (F5)
- [ ] Changes still appear after refresh
- [ ] Check Google Sheet - changes are reflected

### Multiple Updates

- [ ] Update one location
- [ ] Close InfoWindow
- [ ] Open different location
- [ ] Update it
- [ ] Both updates persist
- [ ] Verify all changes in Google Sheet

### Error Handling

- [ ] Disconnect internet
- [ ] Try to save changes
- [ ] Error message appears (red)
- [ ] Error says "Failed to update location"
- [ ] Changes revert to original values
- [ ] Reconnect internet
- [ ] Try save again - should work

---

## Mobile Testing

### iOS Safari Testing

Test on actual iPhone (preferred) or iOS Simulator:

#### Initial Load
- [ ] App loads without zoom on input focus
- [ ] No horizontal scrolling
- [ ] Status bar color is blue
- [ ] Map fills entire viewport
- [ ] Safe area insets are respected (notch area)

#### Touch Interactions
- [ ] Can tap markers easily
- [ ] Markers are large enough (44x44px minimum)
- [ ] Can scroll map with one finger
- [ ] No accidental zooms while scrolling
- [ ] Double-tap to zoom works
- [ ] Pinch to zoom works

#### InfoWindow
- [ ] InfoWindow displays correctly
- [ ] Status dropdown is touch-friendly
- [ ] Can tap dropdown to open options
- [ ] Can select new status easily
- [ ] Textarea is easy to tap
- [ ] Keyboard appears when tapping textarea
- [ ] No page zoom when focusing inputs (16px font size)
- [ ] Can type notes easily
- [ ] Save/Cancel buttons are easy to tap

#### Get Directions
- [ ] "Get Directions" button works
- [ ] Opens Apple Maps app (not browser)
- [ ] Shows correct destination
- [ ] Returns to app after viewing directions

#### Keyboard Behavior
- [ ] Keyboard appears over map (doesn't resize viewport)
- [ ] Can still see textarea while typing
- [ ] Keyboard dismisses when tapping outside
- [ ] No layout shifting when keyboard appears/dismisses

### Android Chrome Testing

Test on actual Android device or emulator:

#### Initial Load
- [ ] App loads correctly
- [ ] No horizontal scrolling
- [ ] Map fills entire screen
- [ ] No browser UI chrome overlapping content

#### Touch Interactions
- [ ] Can tap markers
- [ ] Can scroll map with one finger
- [ ] Pinch to zoom works
- [ ] Double-tap to zoom works
- [ ] No lag or stuttering

#### InfoWindow
- [ ] Displays correctly
- [ ] Dropdown works
- [ ] Textarea works
- [ ] Keyboard behaves properly
- [ ] No page zoom on focus

#### Get Directions
- [ ] Opens Google Maps app (not browser)
- [ ] Shows correct destination
- [ ] Can return to app

### Tablet Testing (Optional)

- [ ] Layout looks good on tablet (iPad, Android tablet)
- [ ] InfoWindow is appropriately sized
- [ ] Touch targets are adequate
- [ ] Both portrait and landscape work

---

## Error Handling Testing

### Missing Environment Variables

- [ ] Rename `.env.local` temporarily
- [ ] Restart server
- [ ] Error message appears
- [ ] Message mentions missing API key
- [ ] Restore `.env.local` and restart

### Invalid API Key

- [ ] Change API key to invalid value in `.env.local`
- [ ] Restart server
- [ ] Map fails to load with error
- [ ] Error message is user-friendly
- [ ] Restore correct API key

### Network Errors

- [ ] Disconnect internet
- [ ] Refresh page
- [ ] Error state appears
- [ ] Error message: "Failed to load locations"
- [ ] "Try Again" button appears
- [ ] Reconnect internet
- [ ] Click "Try Again"
- [ ] App loads successfully

### Google Sheets Errors

#### Sheet Not Found
- [ ] Change `SHEET_ID` to invalid value
- [ ] Restart server
- [ ] Error appears: "Google Sheet not found"
- [ ] Restore correct SHEET_ID

#### Permission Denied
- [ ] Remove service account from sheet sharing
- [ ] Refresh app
- [ ] Error: "Permission denied"
- [ ] Re-share sheet with service account
- [ ] Refresh app - should work

### Invalid Data

- [ ] Add location with invalid status in sheet
- [ ] Refresh app
- [ ] Location shows with default status (Prospect)
- [ ] Console shows warning about invalid status

- [ ] Add location with lat/lng as text (not numbers)
- [ ] Refresh app
- [ ] Location is skipped or geocoded
- [ ] Console shows warning

---

## Performance Testing

### Load Time

- [ ] Initial page load < 3 seconds
- [ ] Map initialization < 2 seconds
- [ ] Markers render < 1 second after data loads
- [ ] No visible lag or stutter

### Interaction Speed

- [ ] Clicking marker opens InfoWindow < 500ms
- [ ] InfoWindow closes instantly
- [ ] Status dropdown opens instantly
- [ ] Typing in notes has no lag
- [ ] Save operation completes < 2 seconds
- [ ] Refresh button triggers reload < 3 seconds

### Large Dataset

Create 50+ locations in sheet:

- [ ] All locations load successfully
- [ ] Map zooms to fit all markers
- [ ] Markers are not too crowded
- [ ] Clicking individual markers works
- [ ] No performance degradation
- [ ] Memory usage is reasonable

### Memory Leaks

- [ ] Open/close 10 different InfoWindows
- [ ] Check browser task manager
- [ ] Memory usage is stable
- [ ] No continuous memory growth

---

## Browser Compatibility Testing

### Desktop Browsers

#### Google Chrome (Latest)
- [ ] App loads correctly
- [ ] All features work
- [ ] Console has no errors
- [ ] Performance is good

#### Mozilla Firefox (Latest)
- [ ] App loads correctly
- [ ] Map renders correctly
- [ ] Markers work
- [ ] InfoWindow works
- [ ] Save functionality works

#### Safari (Latest, macOS)
- [ ] App loads correctly
- [ ] Map renders correctly
- [ ] All interactions work
- [ ] No Safari-specific issues

#### Microsoft Edge (Latest)
- [ ] App loads correctly
- [ ] All features work
- [ ] Performance is good

### Mobile Browsers

#### iOS Safari
- [ ] See [iOS Safari Testing](#ios-safari-testing) section above

#### Chrome for Android
- [ ] See [Android Chrome Testing](#android-chrome-testing) section above

#### Samsung Internet (Android)
- [ ] App loads and works
- [ ] No Samsung-specific issues

---

## Deployment Testing

### Vercel Production Deployment

After deploying to Vercel:

#### Initial Checks
- [ ] Production URL loads
- [ ] No console errors
- [ ] All environment variables are set
- [ ] API calls work in production

#### Functionality
- [ ] Map loads with all locations
- [ ] Markers are clickable
- [ ] InfoWindow works
- [ ] Save functionality works
- [ ] Get Directions works
- [ ] Refresh works

#### Performance
- [ ] Production build is optimized
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

#### Security
- [ ] API key restrictions are set
- [ ] Only allowed domains can access
- [ ] No secrets exposed in client code
- [ ] HTTPS is enforced

#### Error Handling
- [ ] Invalid URL shows 404
- [ ] API errors handled gracefully
- [ ] No stack traces in production

---

## Post-Deployment Testing

### Live Production Testing

- [ ] Test from different devices
- [ ] Test from different networks
- [ ] Test with real users
- [ ] Monitor error logs in Vercel
- [ ] Check Google Cloud API usage
- [ ] Verify no unexpected charges

### Monitoring

- [ ] Set up Google Cloud billing alerts
- [ ] Monitor API quotas
- [ ] Check Vercel analytics
- [ ] Review error logs daily (first week)

---

## Test Results Documentation

### Test Report Template

```
Date: __________
Tester: __________
Environment: Development / Production
Device: __________
Browser: __________

Test Results:
- Initial Load: PASS / FAIL
- Map Functionality: PASS / FAIL
- InfoWindow: PASS / FAIL
- Data Updates: PASS / FAIL
- Mobile Experience: PASS / FAIL
- Error Handling: PASS / FAIL

Issues Found:
1. __________
2. __________
3. __________

Overall Status: PASS / FAIL
```

---

## Critical Path Testing

If time is limited, focus on these critical tests:

1. **Basic Load**
   - [ ] App loads without errors
   - [ ] Map displays with markers

2. **Core Interaction**
   - [ ] Click marker opens InfoWindow
   - [ ] InfoWindow displays correctly

3. **Update Functionality**
   - [ ] Can change status
   - [ ] Can save changes
   - [ ] Changes persist

4. **Mobile Basics**
   - [ ] Works on iPhone
   - [ ] Works on Android
   - [ ] Touch interactions work

5. **Data Integrity**
   - [ ] Changes sync to Google Sheets
   - [ ] Data persists after refresh

---

## Known Limitations

Document any known issues that are acceptable:

- [ ] No real-time sync (manual refresh required)
- [ ] No offline support
- [ ] InfoWindow centered on screen (not anchored to marker)
- [ ] No marker clustering for large datasets
- [ ] Zoom disabled (may affect accessibility)

---

## Sign-Off

### Development Testing Complete

- [ ] All critical tests pass
- [ ] No blocking issues
- [ ] Ready for production deployment

**Tested by:** ___________________
**Date:** ___________________
**Signature:** ___________________

### Production Testing Complete

- [ ] Production deployment successful
- [ ] All features work in production
- [ ] Performance meets requirements
- [ ] No critical issues

**Approved by:** ___________________
**Date:** ___________________
**Signature:** ___________________

---

## Additional Resources

- **Bug Report Template:** Include URL, steps to reproduce, expected vs actual behavior
- **Performance Monitoring:** Use Vercel Analytics or Google Analytics
- **Error Tracking:** Consider Sentry or LogRocket for production
- **User Feedback:** Set up feedback mechanism for real users

---

**Testing Checklist Complete!** Use this document for every release cycle to ensure quality.
