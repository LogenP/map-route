'use client';

/**
 * LocationMarker Component
 *
 * Displays an individual location marker on Google Maps with an interactive InfoWindow.
 * Supports editing status and notes inline with optimistic updates.
 *
 * Features:
 * - Color-coded markers based on location status
 * - Editable status dropdown with all 6 status options
 * - Editable notes textarea with character limit
 * - "Get Directions" button for native maps integration
 * - Optimistic updates with loading states
 * - Error handling and user feedback
 * - Mobile-optimized touch targets and inputs
 *
 * @module components/LocationMarker
 */

import { useState, useCallback, useEffect } from 'react';
import type { Location, LocationStatus } from '@/types/location';
import type { UpdateLocationResponse, ErrorResponse } from '@/types/api';
import { LOCATION_STATUSES } from '@/types/location';
import {
  getDirectionsUrl,
  VALIDATION,
  API_ENDPOINTS,
  HTTP_METHODS,
} from '@/lib/constants';

/**
 * Props interface for LocationMarker component
 */
interface LocationMarkerProps {
  /** Location data to display */
  location: Location;
  /** Whether the InfoWindow is currently open */
  isOpen: boolean;
  /** Callback when InfoWindow should be closed */
  onClose: () => void;
  /** Callback when location data is updated */
  onUpdate: (updated: Location) => void;
}

/**
 * State for tracking editing and API calls
 */
interface EditState {
  /** Whether user is currently editing */
  isEditing: boolean;
  /** Loading state during save */
  isSaving: boolean;
  /** Error message if save fails */
  error: string | null;
  /** Success message after save */
  success: boolean;
}

/**
 * Validation result for form inputs
 */
interface ValidationResult {
  /** Whether the input is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * LocationMarker Component
 *
 * Renders a Google Maps marker with an interactive InfoWindow for viewing
 * and editing location details. Handles all user interactions including
 * status changes, notes updates, and navigation.
 *
 * @example
 * ```tsx
 * <LocationMarker
 *   location={location}
 *   isOpen={selectedId === location.id}
 *   onClose={() => setSelectedId(null)}
 *   onUpdate={(updated) => updateLocationInState(updated)}
 * />
 * ```
 */
export default function LocationMarker({
  location,
  isOpen,
  onClose,
  onUpdate,
}: LocationMarkerProps): JSX.Element | null {
  // Local state for edited values
  const [editedStatus, setEditedStatus] = useState<LocationStatus>(location.status);
  const [editedNotes, setEditedNotes] = useState<string>(location.notes);
  const [editedFollowUpDate, setEditedFollowUpDate] = useState<string>(
    location.followUpDate || ''
  );

  // Edit and save state
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    isSaving: false,
    error: null,
    success: false,
  });

  // Validation state
  const [notesError, setNotesError] = useState<string | null>(null);

  // Sync local state when location prop changes
  useEffect(() => {
    setEditedStatus(location.status);
    setEditedNotes(location.notes);
    setEditedFollowUpDate(location.followUpDate || '');
    // Reset edit state when location changes
    setEditState({
      isEditing: false,
      isSaving: false,
      error: null,
      success: false,
    });
    setNotesError(null);
  }, [location.id, location.status, location.notes, location.followUpDate]);

  /**
   * Validates notes input
   */
  const validateNotes = useCallback((notes: string): ValidationResult => {
    if (notes.length > VALIDATION.MAX_NOTES_LENGTH) {
      return {
        isValid: false,
        error: `Notes must be ${VALIDATION.MAX_NOTES_LENGTH} characters or less`,
      };
    }
    return { isValid: true };
  }, []);

  /**
   * Checks if there are unsaved changes
   */
  const hasChanges = useCallback((): boolean => {
    return (
      editedStatus !== location.status ||
      editedNotes.trim() !== location.notes.trim() ||
      editedFollowUpDate !== (location.followUpDate || '')
    );
  }, [editedStatus, editedNotes, editedFollowUpDate, location.status, location.notes, location.followUpDate]);

  /**
   * Handles status change from dropdown
   */
  const handleStatusChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const newStatus = event.target.value as LocationStatus;
      setEditedStatus(newStatus);

      // Enable editing mode when status changes
      if (!editState.isEditing) {
        setEditState((prev) => ({ ...prev, isEditing: true }));
      }

      // Clear previous messages
      setEditState((prev) => ({ ...prev, error: null, success: false }));
    },
    [editState.isEditing]
  );

  /**
   * Handles notes textarea change
   */
  const handleNotesChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
      const newNotes = event.target.value;
      setEditedNotes(newNotes);

      // Validate notes
      const validation = validateNotes(newNotes);
      setNotesError(validation.isValid ? null : validation.error || null);

      // Enable editing mode when notes change
      if (!editState.isEditing) {
        setEditState((prev) => ({ ...prev, isEditing: true }));
      }

      // Clear previous messages
      setEditState((prev) => ({ ...prev, error: null, success: false }));
    },
    [editState.isEditing, validateNotes]
  );

  /**
   * Handles follow-up date change
   */
  const handleFollowUpDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const newDate = event.target.value;
      setEditedFollowUpDate(newDate);

      // Enable editing mode when date changes
      if (!editState.isEditing) {
        setEditState((prev) => ({ ...prev, isEditing: true }));
      }

      // Clear previous messages
      setEditState((prev) => ({ ...prev, error: null, success: false }));
    },
    [editState.isEditing]
  );

  /**
   * Saves changes to the API
   */
  const handleSave = useCallback(async (): Promise<void> => {
    // Don't save if no changes or validation errors
    if (!hasChanges()) {
      setEditState((prev) => ({ ...prev, isEditing: false }));
      return;
    }

    if (notesError) {
      return;
    }

    // Set loading state
    setEditState((prev) => ({
      ...prev,
      isSaving: true,
      error: null,
      success: false,
    }));

    // Optimistic update - update UI immediately
    const optimisticLocation: Location = {
      ...location,
      status: editedStatus,
      notes: editedNotes.trim(),
      followUpDate: editedFollowUpDate || undefined,
    };
    onUpdate(optimisticLocation);

    try {
      // Call PATCH API
      const response = await fetch(API_ENDPOINTS.UPDATE_LOCATION(location.id), {
        method: HTTP_METHODS.PATCH,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editedStatus,
          notes: editedNotes.trim(),
          followUpDate: editedFollowUpDate || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UpdateLocationResponse | ErrorResponse = await response.json();

      if (!data.success) {
        // Revert optimistic update on error
        onUpdate(location);

        const errorMsg =
          'error' in data
            ? data.error
            : 'Failed to update location. Please try again.';

        setEditState((prev) => ({
          ...prev,
          isSaving: false,
          error: errorMsg,
          success: false,
        }));

        console.error('[LocationMarker] Update failed:', data);
        return;
      }

      // Success - update with server response
      if ('location' in data) {
        onUpdate(data.location);
      }

      console.log('[LocationMarker] Successfully updated location:', location.id);

      // Close the popup immediately after successful save
      onClose();
    } catch (error) {
      // Revert optimistic update on error
      onUpdate(location);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Network error. Please check your connection.';

      setEditState((prev) => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
        success: false,
      }));

      console.error('[LocationMarker] Error updating location:', error);
    }
  }, [
    hasChanges,
    notesError,
    location,
    editedStatus,
    editedNotes,
    editedFollowUpDate,
    onUpdate,
    onClose,
  ]);

  /**
   * Cancels editing and reverts changes
   */
  const handleCancel = useCallback((): void => {
    setEditedStatus(location.status);
    setEditedNotes(location.notes);
    setEditedFollowUpDate(location.followUpDate || '');
    setNotesError(null);
    setEditState({
      isEditing: false,
      isSaving: false,
      error: null,
      success: false,
    });
  }, [location.status, location.notes, location.followUpDate]);

  /**
   * Opens native maps app for directions
   */
  const handleGetDirections = useCallback((): void => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const url = getDirectionsUrl(
      location.lat,
      location.lng,
      location.companyName,
      userAgent
    );

    // Open in new window/tab or native app
    window.open(url, '_blank');
  }, [location.lat, location.lng, location.companyName]);

  /**
   * Handles InfoWindow close
   */
  const handleClose = useCallback((): void => {
    // If there are unsaved changes, ask for confirmation
    if (hasChanges() && editState.isEditing) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirm) {
        return;
      }
    }

    // Reset state and close
    handleCancel();
    onClose();
  }, [hasChanges, editState.isEditing, handleCancel, onClose]);

  // Don't render if location has invalid coordinates
  if (!location.lat || !location.lng) {
    console.warn(
      `[LocationMarker] Location ${location.id} has invalid coordinates:`,
      { lat: location.lat, lng: location.lng }
    );
    return null;
  }

  // Render InfoWindow content only
  // Note: Parent component is responsible for rendering the actual Google Maps marker
  // and handling marker click events. This component only renders the InfoWindow content.
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="min-w-[280px] max-w-[320px] p-4 bg-white rounded-lg shadow-lg"
      style={{ maxWidth: '90vw' }}
    >
      {/* Header with company name */}
      <div className="flex items-start justify-between mb-3 border-b border-gray-200 pb-2">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight flex-1 pr-2">
          {location.companyName}
        </h3>
        <button
          type="button"
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 -mt-2"
          aria-label="Close"
        >
          <svg
            className="h-6 w-6"
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

      {/* Address */}
      <div className="mb-3">
        <p className="text-sm text-gray-600 leading-relaxed">{location.address}</p>
      </div>

      {/* Status Dropdown */}
      <div className="mb-3">
        <label
          htmlFor={`status-${location.id}`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Status
        </label>
        <select
          id={`status-${location.id}`}
          value={editedStatus}
          onChange={handleStatusChange}
          disabled={editState.isSaving}
          className="w-full min-h-[44px] px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors touch-manipulation"
          style={{
            fontSize: '16px', // Prevent iOS zoom on focus
          }}
        >
          {LOCATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Follow-up Date Input */}
      <div className="mb-3">
        <label
          htmlFor={`followUpDate-${location.id}`}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Follow-up Date
        </label>
        <div className="flex gap-2">
          <input
            type="date"
            id={`followUpDate-${location.id}`}
            value={editedFollowUpDate}
            onChange={handleFollowUpDateChange}
            disabled={editState.isSaving}
            className="flex-1 min-h-[44px] px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors touch-manipulation"
            style={{
              fontSize: '16px', // Prevent iOS zoom on focus
              maxWidth: '100%',
            }}
          />
          {editedFollowUpDate && (
            <button
              type="button"
              onClick={() => {
                setEditedFollowUpDate('');
                if (!editState.isEditing) {
                  setEditState((prev) => ({ ...prev, isEditing: true }));
                }
                setEditState((prev) => ({ ...prev, error: null, success: false }));
              }}
              disabled={editState.isSaving}
              className="flex-shrink-0 min-h-[44px] min-w-[44px] px-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 active:bg-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors touch-manipulation flex items-center justify-center"
              aria-label="Clear date"
              title="Clear date"
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
          )}
        </div>
      </div>

      {/* Notes Textarea */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor={`notes-${location.id}`}
            className="block text-sm font-medium text-gray-700"
          >
            Notes
            <span className="text-xs text-gray-500 ml-2">
              ({editedNotes.length}/{VALIDATION.MAX_NOTES_LENGTH})
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${String(now.getFullYear()).slice(-2)}`;
              const dateStamp = `${dateStr}: `;

              // Find the last newline or start of string
              const currentNotes = editedNotes.trim();
              let newNotes = '';

              if (currentNotes === '') {
                // Empty notes - just add the date stamp
                newNotes = dateStamp;
              } else {
                // Existing notes - add newline and date stamp
                newNotes = currentNotes + '\n' + dateStamp;
              }

              setEditedNotes(newNotes);

              // Validate the new notes
              const validation = validateNotes(newNotes);
              setNotesError(validation.isValid ? null : validation.error || null);

              // Enable editing mode
              if (!editState.isEditing) {
                setEditState((prev) => ({ ...prev, isEditing: true }));
              }

              // Clear previous messages
              setEditState((prev) => ({ ...prev, error: null, success: false }));
            }}
            disabled={editState.isSaving}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 active:bg-blue-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            title="Add date stamp"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Add Date
          </button>
        </div>
        <textarea
          id={`notes-${location.id}`}
          value={editedNotes}
          onChange={handleNotesChange}
          disabled={editState.isSaving}
          placeholder="Add notes about this location..."
          rows={4}
          className={`w-full px-3 py-2 text-base border ${
            notesError ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 ${
            notesError ? 'focus:ring-red-500' : 'focus:ring-blue-500'
          } focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none transition-colors touch-manipulation`}
          style={{
            fontSize: '16px', // Prevent iOS zoom on focus
          }}
        />
        {notesError && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {notesError}
          </p>
        )}
      </div>

      {/* Error Message */}
      {editState.error && (
        <div
          className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md"
          role="alert"
        >
          <p className="text-sm text-red-800">{editState.error}</p>
        </div>
      )}

      {/* Success Message */}
      {editState.success && (
        <div
          className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md"
          role="status"
        >
          <p className="text-sm text-green-800">Location updated successfully!</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col space-y-2">
        {/* Save/Cancel Buttons - Show when editing */}
        {editState.isEditing && (
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={editState.isSaving || !hasChanges() || !!notesError}
              className="flex-1 min-h-[44px] px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              {editState.isSaving ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={editState.isSaving}
              className="flex-1 min-h-[44px] px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 active:bg-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Get Directions Button - Always visible */}
        <button
          type="button"
          onClick={handleGetDirections}
          disabled={editState.isSaving}
          className="w-full min-h-[44px] px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 active:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 touch-manipulation"
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
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <span>Get Directions</span>
        </button>
      </div>
    </div>
  );
}
