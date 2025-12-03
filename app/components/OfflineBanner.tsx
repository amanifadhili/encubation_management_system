/**
 * Offline Banner Component
 * Displays a banner when the user is offline with reconnection status
 */
import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export interface OfflineBannerProps {
  showReconnected?: boolean;
  reconnectedDuration?: number;
  position?: 'top' | 'bottom';
  className?: string;
}

export function OfflineBanner({
  showReconnected = true,
  reconnectedDuration = 3000,
  position = 'top',
  className = ''
}: OfflineBannerProps) {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline && showReconnected) {
      setShowReconnectedBanner(true);
      
      // Hide reconnected banner after duration
      const timer = setTimeout(() => {
        setShowReconnectedBanner(false);
      }, reconnectedDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, showReconnected, reconnectedDuration]);

  // Don't show anything if online and not showing reconnected message
  if (isOnline && !showReconnectedBanner) {
    return null;
  }

  const positionClasses = position === 'top' 
    ? 'top-0' 
    : 'bottom-0';

  return (
    <div
      className={`fixed left-0 right-0 ${positionClasses} z-50 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {!isOnline ? (
        // Offline Banner
        <div className="bg-red-600 text-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-center max-w-7xl mx-auto">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">
              No Internet Connection
            </span>
            <span className="ml-2 text-sm opacity-90">
              • Some features may be unavailable
            </span>
          </div>
        </div>
      ) : showReconnectedBanner ? (
        // Reconnected Banner
        <div className="bg-green-600 text-white px-4 py-3 shadow-lg">
          <div className="flex items-center justify-center max-w-7xl mx-auto">
            <svg
              className="w-5 h-5 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">
              Back Online
            </span>
            <span className="ml-2 text-sm opacity-90">
              • Connection restored
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default OfflineBanner;
