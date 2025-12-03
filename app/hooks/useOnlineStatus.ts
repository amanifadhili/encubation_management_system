/**
 * Online Status Hook
 * Detects and tracks the user's network connection status
 */
import { useState, useEffect } from 'react';

export interface OnlineStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  pingUrl?: string;
  pingInterval?: number;
}

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
}

/**
 * Hook to monitor online/offline status
 * @param options - Configuration options
 * @returns Online status information
 */
export function useOnlineStatus(options: OnlineStatusOptions = {}): OnlineStatus {
  const { onOnline, onOffline, pingUrl, pingInterval = 30000 } = options;
  
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null);

  useEffect(() => {
    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setLastOnlineTime(new Date());
      
      if (onOnline) {
        onOnline();
      }
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setLastOfflineTime(new Date());
      
      if (onOffline) {
        onOffline();
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Optional: Periodic ping to verify connection
    let pingIntervalId: NodeJS.Timeout | null = null;
    
    if (pingUrl) {
      pingIntervalId = setInterval(async () => {
        try {
          const response = await fetch(pingUrl, {
            method: 'HEAD',
            cache: 'no-cache'
          });
          
          if (response.ok && !isOnline) {
            handleOnline();
          }
        } catch (error) {
          if (isOnline) {
            handleOffline();
          }
        }
      }, pingInterval);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (pingIntervalId) {
        clearInterval(pingIntervalId);
      }
    };
  }, [isOnline, onOnline, onOffline, pingUrl, pingInterval]);

  return {
    isOnline,
    wasOffline,
    lastOnlineTime,
    lastOfflineTime
  };
}

/**
 * Simple hook that returns just the online status
 * @returns boolean indicating if user is online
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default useOnlineStatus;
