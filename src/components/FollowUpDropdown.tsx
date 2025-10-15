/**
 * FollowUpDropdown Component
 *
 * Displays a dropdown showing the count of follow-ups scheduled for a specific date.
 * When clicked, shows a list of company names with follow-ups on that date.
 * Clicking a company name selects that location and opens its popup.
 *
 * @module components/FollowUpDropdown
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { Location } from '@/types/location';

/**
 * Props for the FollowUpDropdown component
 */
interface FollowUpDropdownProps {
  /** All locations from the app */
  locations: Location[];
  /** Currently selected follow-up date (YYYY-MM-DD format) */
  selectedFollowUpDate: string;
  /** Callback when a location is clicked */
  onLocationClick: (location: Location) => void;
}

/**
 * FollowUpDropdown Component
 *
 * Shows follow-ups scheduled for the selected date and allows navigation to them.
 *
 * @param props - Component props
 * @returns FollowUpDropdown JSX
 */
export default function FollowUpDropdown({
  locations,
  selectedFollowUpDate,
  onLocationClick,
}: FollowUpDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Filter locations that match the selected follow-up date
   */
  const followUpLocations = locations.filter(
    (location) => location.followUpDate === selectedFollowUpDate
  );

  const count = followUpLocations.length;

  /**
   * Handle clicking outside the dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Handle clicking on a company name
   */
  const handleCompanyClick = (location: Location): void => {
    onLocationClick(location);
    setIsOpen(false);
  };

  /**
   * Toggle dropdown open/closed
   */
  const toggleDropdown = (): void => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={dropdownRef} className="relative z-50">
      {/* Dropdown Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow min-h-[44px] touch-manipulation"
        type="button"
        aria-label={`${count} follow-ups scheduled for ${selectedFollowUpDate}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
          {count} {count === 1 ? 'Follow-up' : 'Follow-ups'}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg py-2 min-w-[250px] max-w-[90vw] max-h-[60vh] overflow-y-auto"
          role="menu"
          aria-label="Follow-up locations"
        >
          {count === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No follow-ups scheduled for this date
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {followUpLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleCompanyClick(location)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors min-h-[44px] touch-manipulation"
                  type="button"
                  role="menuitem"
                >
                  <div className="font-medium text-sm text-gray-900">
                    {location.companyName}
                  </div>
                  {location.address && (
                    <div className="text-xs text-gray-500 mt-1">
                      {location.address}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
