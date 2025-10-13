/**
 * Map Component
 *
 * A mobile-first Google Maps component that displays business locations
 * with color-coded markers based on their status. Handles marker clicks
 * and provides an interactive map experience.
 *
 * Features:
 * - Google Maps integration using @googlemaps/js-api-loader
 * - Color-coded markers based on location status
 * - Clickable markers with event handling
 * - Loading states and error handling
 * - Mobile-optimized and touch-friendly
 * - Automatic bounds fitting for all markers
 *
 * @module components/Map
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Internal types
import type { Location } from '@/types/location';
import type { Coordinates } from '@/types/google';

// Internal constants
import { clientConfig } from '@/lib/client-config';
import { getMarkerIcon, createMarkerIcon, FOLLOW_UP_DATE_COLOR } from '@/lib/constants';

/**
 * Props interface for the Map component
 */
interface MapProps {
  /** Array of locations to display on the map */
  locations: Location[];
  /** Callback when a marker is clicked */
  onMarkerClick?: (location: Location) => void;
  /** ID of the currently selected location (for highlighting) */
  selectedLocationId?: number | null;
  /** User's current location to pan to */
  userLocation?: { lat: number; lng: number } | null;
  /** Selected follow-up date to highlight locations (YYYY-MM-DD format) */
  selectedFollowUpDate?: string;
}

/**
 * Map component that displays business locations on Google Maps.
 *
 * @example
 * ```tsx
 * <Map
 *   locations={locations}
 *   onMarkerClick={(location) => console.log('Clicked:', location)}
 *   selectedLocationId={selectedId}
 * />
 * ```
 */
export default function Map({
  locations,
  onMarkerClick,
  selectedLocationId,
  userLocation,
  selectedFollowUpDate,
}: MapProps): JSX.Element {
  console.log('[Map] Component rendered with', locations.length, 'locations');

  // State management
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Refs for DOM elements and Google Maps objects
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<globalThis.Map<number, google.maps.Marker>>(new globalThis.Map());
  const userLocationMarkerRef = useRef<google.maps.Marker | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const hasSetInitialBoundsRef = useRef<boolean>(false);

  /**
   * Initialize Google Maps API and create map instance
   */
  useEffect(() => {
    console.log('[Map] useEffect running - isInitialized:', isInitializedRef.current, 'mapContainer:', !!mapContainerRef.current);

    // Don't initialize if already initialized
    if (isInitializedRef.current) {
      console.log('[Map] Skipping initialization - already initialized');
      return;
    }

    // Wait for map container to be ready
    if (!mapContainerRef.current) {
      console.log('[Map] Skipping initialization - map container not ready');
      return;
    }

    console.log('[Map] Starting map initialization...');

    const initializeMap = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Validate API key
        if (!clientConfig.googleMaps.apiKey) {
          throw new Error('Google Maps API key is not configured');
        }

        // Set loader options
        console.log('[Map] Setting up Google Maps API loader...');
        console.log('[Map] API Key present:', !!clientConfig.googleMaps.apiKey);

        setOptions({
          key: clientConfig.googleMaps.apiKey,
          v: 'weekly',
          libraries: ['places', 'marker'],
        });

        // Load Google Maps API
        console.log('[Map] Loading Maps library...');
        const { Map: GoogleMap } = await importLibrary('maps');
        console.log('[Map] Maps library loaded successfully');

        // Mark as initialized
        isInitializedRef.current = true;

        // Create map instance
        if (!mapContainerRef.current) {
          throw new Error('Map container not found');
        }

        const map = new GoogleMap(mapContainerRef.current, {
          center: clientConfig.googleMaps.defaultCenter,
          zoom: clientConfig.googleMaps.defaultZoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          gestureHandling: 'greedy', // Better for mobile
          clickableIcons: false, // Disable POI clicks
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        setMapInstance(map);
        setIsLoading(false);

        console.log('[Map] Google Maps initialized successfully');
      } catch (error) {
        console.error('[Map] Failed to initialize Google Maps:', error);
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Failed to load Google Maps. Please refresh the page.'
        );
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      // Clear all markers
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });
      markersRef.current.clear();

      // Clear user location marker
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.setMap(null);
        userLocationMarkerRef.current = null;
      }
    };
  }, []);

  /**
   * Update markers when locations change
   */
  useEffect(() => {
    if (!mapInstance || locations.length === 0) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current.clear();

    // Filter locations with valid coordinates
    const validLocations = locations.filter(
      (loc) =>
        typeof loc.lat === 'number' &&
        typeof loc.lng === 'number' &&
        !isNaN(loc.lat) &&
        !isNaN(loc.lng) &&
        loc.lat >= -90 &&
        loc.lat <= 90 &&
        loc.lng >= -180 &&
        loc.lng <= 180
    );

    if (validLocations.length === 0) {
      console.warn('[Map] No locations with valid coordinates to display');
      return;
    }

    // Create bounds for fitting all markers
    const bounds = new google.maps.LatLngBounds();

    // Create markers for each location
    validLocations.forEach((location) => {
      try {
        const position: Coordinates = {
          lat: location.lat,
          lng: location.lng,
        };

        // Determine marker color based on follow-up date match or status
        const hasFollowUpDateMatch =
          selectedFollowUpDate &&
          location.followUpDate &&
          location.followUpDate === selectedFollowUpDate;

        // Get marker icon configuration
        const markerIconConfig = hasFollowUpDateMatch
          ? createMarkerIcon(FOLLOW_UP_DATE_COLOR) // Purple for follow-up date match
          : getMarkerIcon(location.status); // Regular status color

        // Create marker
        const marker = new google.maps.Marker({
          position,
          map: mapInstance,
          title: location.companyName,
          icon: {
            path: markerIconConfig.path,
            fillColor: markerIconConfig.fillColor,
            fillOpacity: markerIconConfig.fillOpacity,
            strokeColor: markerIconConfig.strokeColor,
            strokeWeight: markerIconConfig.strokeWeight,
            scale: markerIconConfig.scale,
            anchor: new google.maps.Point(
              markerIconConfig.anchor?.x ?? 12,
              markerIconConfig.anchor?.y ?? 22
            ),
          },
          clickable: true,
          optimized: true,
        });

        // Add click listener
        marker.addListener('click', () => {
          if (onMarkerClick) {
            onMarkerClick(location);
          }
        });

        // Store marker reference
        markersRef.current.set(location.id, marker);

        // Extend bounds to include this marker
        bounds.extend(position);
      } catch (error) {
        console.error(
          `[Map] Failed to create marker for location ${location.id}:`,
          error
        );
      }
    });

    // Fit map to show all markers only on initial load
    // Don't reset bounds when locations update (e.g., when user saves changes)
    if (validLocations.length > 0 && !hasSetInitialBoundsRef.current) {
      mapInstance.fitBounds(bounds);
      hasSetInitialBoundsRef.current = true;

      // If only one marker, set a reasonable zoom level
      if (validLocations.length === 1) {
        const listener = google.maps.event.addListenerOnce(
          mapInstance,
          'bounds_changed',
          () => {
            const currentZoom = mapInstance.getZoom();
            if (currentZoom && currentZoom > 15) {
              mapInstance.setZoom(15);
            }
          }
        );

        // Cleanup listener after 1 second
        setTimeout(() => {
          google.maps.event.removeListener(listener);
        }, 1000);
      }
    }

    console.log(
      `[Map] Created ${markersRef.current.size} markers for ${validLocations.length} locations`
    );
  }, [mapInstance, locations, onMarkerClick, selectedFollowUpDate]);

  /**
   * Pan to user location when requested and add marker
   */
  useEffect(() => {
    if (!mapInstance || !userLocation) {
      return;
    }

    console.log('[Map] Panning to user location:', userLocation);

    // Remove existing user location marker if present
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null);
    }

    // Create a blue dot marker for user location
    const userMarker = new google.maps.Marker({
      position: userLocation,
      map: mapInstance,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
        scale: 8,
      },
      title: 'Your Location',
      zIndex: 2000, // Above all other markers
    });

    userLocationMarkerRef.current = userMarker;

    // Pan to user location with smooth animation
    mapInstance.panTo(userLocation);

    // Set a reasonable zoom level for user location
    const currentZoom = mapInstance.getZoom();
    if (!currentZoom || currentZoom < 14) {
      mapInstance.setZoom(14);
    }
  }, [mapInstance, userLocation]);

  /**
   * Highlight selected marker
   */
  useEffect(() => {
    if (!mapInstance || !selectedLocationId) {
      return;
    }

    // Reset all markers to normal scale and z-index
    markersRef.current.forEach((marker, locationId) => {
      const location = locations.find((loc) => loc.id === locationId);
      if (location) {
        // Determine if this location has a follow-up date match
        const hasFollowUpDateMatch =
          selectedFollowUpDate &&
          location.followUpDate &&
          location.followUpDate === selectedFollowUpDate;

        const markerIconConfig = hasFollowUpDateMatch
          ? createMarkerIcon(FOLLOW_UP_DATE_COLOR)
          : getMarkerIcon(location.status);

        const currentIcon = marker.getIcon() as google.maps.Symbol | undefined;

        if (currentIcon && typeof currentIcon === 'object') {
          marker.setIcon({
            ...currentIcon,
            scale: markerIconConfig.scale,
          });
        }

        // Reset z-index
        marker.setZIndex(locationId === selectedLocationId ? 1000 : google.maps.Marker.MAX_ZINDEX);
      }
    });

    // Highlight selected marker
    const selectedMarker = markersRef.current.get(selectedLocationId);
    if (selectedMarker) {
      const currentIcon = selectedMarker.getIcon() as
        | google.maps.Symbol
        | undefined;

      if (currentIcon && typeof currentIcon === 'object') {
        selectedMarker.setIcon({
          ...currentIcon,
          scale: (currentIcon.scale ?? 1.5) * 1.2, // Scale up by 20%
        });
      }

      // Set high z-index for selected marker
      selectedMarker.setZIndex(1000);

      // Pan to selected marker
      const position = selectedMarker.getPosition();
      if (position) {
        mapInstance.panTo(position);
      }
    }
  }, [mapInstance, selectedLocationId, locations, selectedFollowUpDate]);

  /**
   * Render map container (always rendered to ensure ref is attached)
   */
  return (
    <div className="relative h-full w-full">
      {/* Map container - always rendered */}
      <div
        ref={mapContainerRef}
        className="h-full w-full"
        role="application"
        aria-label="Interactive map showing business locations"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div
              className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
              role="status"
              aria-label="Loading map"
            />
            <p className="mt-4 text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4 z-10">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center text-red-600">
              <svg
                className="mr-2 h-6 w-6"
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
              <h3 className="text-lg font-semibold">Map Error</h3>
            </div>
            <p className="mb-4 text-sm text-gray-700">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
              type="button"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* No locations message */}
      {!isLoading && !loadError && locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <p className="text-sm text-gray-600">No locations to display</p>
        </div>
      )}
    </div>
  );
}
