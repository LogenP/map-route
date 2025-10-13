/**
 * Main Page Component - Map Route Application
 *
 * This is the main page of the Map Route application. It serves as the
 * orchestration layer that:
 * - Fetches locations from the API
 * - Manages application state (locations, selection, loading, errors)
 * - Integrates the Map component
 * - Handles marker interactions and location updates
 * - Provides loading and error states
 * - Implements mobile-first responsive design
 *
 * @module app/page
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// Internal types
import type { Location } from '@/types/location';
import type { GetLocationsResponse, ErrorResponse } from '@/types/api';

// Internal components
import Map from '@/components/Map';
import LocationMarker from '@/components/LocationMarker';

// Internal constants
import { API_ENDPOINTS, HTTP_METHODS, ERROR_MESSAGES, STATUS_COLORS, STATUS_LABELS, ALL_STATUSES } from '@/lib/constants';

/**
 * Application state interface
 */
interface AppState {
  /** Array of all locations */
  locations: Location[];
  /** Currently selected location for InfoWindow */
  selectedLocation: Location | null;
  /** Loading state during initial data fetch */
  isLoading: boolean;
  /** Error message if data fetch fails */
  error: string | null;
  /** Refresh counter for manual refresh */
  refreshCounter: number;
  /** Selected follow-up date filter (YYYY-MM-DD format) */
  selectedFollowUpDate: string;
}

/**
 * Main Page Component
 *
 * Renders the full-screen map with business location markers.
 * Handles all state management and API interactions.
 *
 * @returns Main page JSX
 */
export default function HomePage(): JSX.Element {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Application state
  const [state, setState] = useState<AppState>({
    locations: [],
    selectedLocation: null,
    isLoading: true,
    error: null,
    refreshCounter: 0,
    selectedFollowUpDate: getTodayDate(),
  });

  // User location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);

  // Legend visibility state
  const [isLegendExpanded, setIsLegendExpanded] = useState<boolean>(false);

  /**
   * Fetches locations from the API
   */
  const fetchLocations = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      console.log('[HomePage] Fetching locations from API...');

      const response = await fetch(API_ENDPOINTS.GET_LOCATIONS, {
        method: HTTP_METHODS.GET,
        headers: {
          'Content-Type': 'application/json',
        },
        // Disable caching for fresh data
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GetLocationsResponse | ErrorResponse = await response.json();

      // Check for API error response
      if ('error' in data && data.success === false) {
        throw new Error(data.error);
      }

      // Extract locations from successful response
      const locations = 'locations' in data ? data.locations : [];

      console.log(`[HomePage] Successfully loaded ${locations.length} locations`);

      setState((prev) => ({
        ...prev,
        locations,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('[HomePage] Error fetching locations:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : ERROR_MESSAGES.LOAD_LOCATIONS;

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * Fetches locations on component mount and when refresh is triggered
   */
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations, state.refreshCounter]);

  /**
   * Handles marker click event
   */
  const handleMarkerClick = useCallback((location: Location): void => {
    console.log('[HomePage] Marker clicked:', location.companyName);
    setState((prev) => ({
      ...prev,
      selectedLocation: location,
    }));
  }, []);

  /**
   * Handles InfoWindow close event
   */
  const handleInfoWindowClose = useCallback((): void => {
    console.log('[HomePage] InfoWindow closed');
    setState((prev) => ({
      ...prev,
      selectedLocation: null,
    }));
  }, []);

  /**
   * Handles location update from InfoWindow
   * Implements optimistic update pattern
   */
  const handleLocationUpdate = useCallback((updatedLocation: Location): void => {
    console.log('[HomePage] Location updated:', updatedLocation.id);

    // Update the location in state immediately (optimistic update)
    setState((prev) => ({
      ...prev,
      locations: prev.locations.map((loc) =>
        loc.id === updatedLocation.id ? updatedLocation : loc
      ),
      selectedLocation: updatedLocation,
    }));
  }, []);

  /**
   * Handles manual refresh button click
   */
  const handleRefresh = useCallback((): void => {
    console.log('[HomePage] Manual refresh triggered');
    setState((prev) => ({
      ...prev,
      refreshCounter: prev.refreshCounter + 1,
    }));
  }, []);

  /**
   * Handles retry button click after error
   */
  const handleRetry = useCallback((): void => {
    console.log('[HomePage] Retry triggered');
    fetchLocations();
  }, [fetchLocations]);

  /**
   * Handles "My Location" button click
   * Gets user's current location and pans map to it
   */
  const handleMyLocation = useCallback((): void => {
    if (!navigator.geolocation) {
      console.error('[HomePage] Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    console.log('[HomePage] Getting user location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };

        setUserLocation(location);
        setIsGettingLocation(false);

        console.log('[HomePage] User location:', location);
      },
      (error) => {
        console.error('[HomePage] Error getting user location:', error);
        setIsGettingLocation(false);

        // Show error message based on error code
        let errorMessage = 'Unable to get your location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable location access.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out.';
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  /**
   * Handles follow-up date change
   */
  const handleFollowUpDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const newDate = event.target.value;
    console.log('[HomePage] Follow-up date changed to:', newDate);
    setState((prev) => ({
      ...prev,
      selectedFollowUpDate: newDate,
    }));
  }, []);

  /**
   * Render loading state
   */
  if (state.isLoading && state.locations.length === 0) {
    return (
      <div className="overlay">
        <div className="loading-container">
          <div className="spinner" role="status" aria-live="polite" />
          <p className="loading-text">Loading locations...</p>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (state.error && state.locations.length === 0) {
    return (
      <div className="overlay">
        <div className="error-container">
          <svg
            className="error-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="error-title">Unable to Load Locations</h1>
          <p className="error-message">{state.error}</p>
          <button
            onClick={handleRetry}
            className="btn btn-error"
            type="button"
            aria-label="Retry loading locations"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render main application
   */
  return (
    <main className="map-container">
      {/* Map Component */}
      <Map
        locations={state.locations}
        onMarkerClick={handleMarkerClick}
        selectedLocationId={state.selectedLocation?.id ?? null}
        userLocation={userLocation}
        selectedFollowUpDate={state.selectedFollowUpDate}
      />

      {/* Collapsible Legend Button */}
      <button
        onClick={() => setIsLegendExpanded(!isLegendExpanded)}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow min-h-[44px] touch-manipulation"
        type="button"
        aria-label={isLegendExpanded ? 'Close filters' : 'Open filters'}
        aria-expanded={isLegendExpanded}
      >
        <svg
          className={`h-5 w-5 transition-transform ${isLegendExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <span className="font-medium text-sm">
          {isLegendExpanded ? 'Hide Filters' : 'Show Filters'}
        </span>
      </button>

      {/* Expandable Legend Panel */}
      {isLegendExpanded && (
        <div
          className="absolute top-16 left-4 z-40 bg-white rounded-lg shadow-lg p-4 max-w-[calc(100vw-2rem)] sm:max-w-sm"
          role="region"
          aria-label="Map controls"
        >
          {/* Follow-up Date Picker */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <label htmlFor="followUpDate" className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Follow-up Date Filter
            </label>
            <input
              type="date"
              id="followUpDate"
              value={state.selectedFollowUpDate}
              onChange={handleFollowUpDateChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              aria-label="Select follow-up date to filter locations"
            />
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Locations matching this date appear in purple
            </p>
          </div>

          {/* Status Legend */}
          <div>
            <div className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Status Legend
            </div>
            <div className="space-y-2">
              {ALL_STATUSES.map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-gray-700">{STATUS_LABELS[status]}</span>
                </div>
              ))}
              {/* Follow-up Date Match Legend Item */}
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200"
                  style={{ backgroundColor: '#9C27B0' }}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-700">Follow-up Date Match</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* InfoWindow Overlay */}
      {state.selectedLocation && (
        <>
          {/* Backdrop - clicking closes the popup */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={handleInfoWindowClose}
            aria-label="Close popup"
          />

          {/* Popup Content */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <LocationMarker
              location={state.selectedLocation}
              isOpen={true}
              onClose={handleInfoWindowClose}
              onUpdate={handleLocationUpdate}
            />
          </div>
        </>
      )}

      {/* Refresh Button (Floating Action Button) */}
      <button
        onClick={handleRefresh}
        className="btn-fab"
        type="button"
        aria-label="Refresh locations"
        disabled={state.isLoading}
        title="Refresh locations"
      >
        <svg
          className={`h-6 w-6 ${state.isLoading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {/* My Location Button */}
      <button
        onClick={handleMyLocation}
        className="btn-location"
        type="button"
        aria-label="Show my location"
        disabled={isGettingLocation}
        title="My Location"
      >
        <svg
          className={`h-6 w-6 ${isGettingLocation ? 'animate-pulse' : ''}`}
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
        </svg>
      </button>

      {/* Loading indicator during refresh */}
      {state.isLoading && state.locations.length > 0 && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-40"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <div
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"
              aria-hidden="true"
            />
            <span className="text-sm text-gray-700">Refreshing...</span>
          </div>
        </div>
      )}

      {/* Error toast during refresh */}
      {state.error && state.locations.length > 0 && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 px-4 py-3 rounded-lg shadow-lg z-40 max-w-sm"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  error: null,
                }))
              }
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              type="button"
              aria-label="Dismiss error"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* No locations message */}
      {!state.isLoading && state.locations.length === 0 && !state.error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-4 rounded-lg shadow-lg z-40">
          <p className="text-sm text-gray-600">
            No locations found. Add locations to your Google Sheet to see them here.
          </p>
        </div>
      )}
    </main>
  );
}
