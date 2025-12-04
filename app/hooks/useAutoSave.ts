import { useEffect, useRef } from 'react';
import { useProfile } from '../context/ProfileContext';

interface UseAutoSaveOptions {
  phase: string;
  data: any;
  interval?: number; // in milliseconds, default 30000 (30 seconds)
  enabled?: boolean;
}

export const useAutoSave = ({
  phase,
  data,
  interval = 30000,
  enabled = true,
}: UseAutoSaveOptions) => {
  const { saveToLocalStorage } = useProfile();
  const dataRef = useRef(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!enabled || !data) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      if (dataRef.current) {
        try {
          saveToLocalStorage(phase, dataRef.current);
          console.log(`Auto-saved ${phase} to localStorage`);
        } catch (error) {
          console.error(`Failed to auto-save ${phase}:`, error);
        }
      }
    }, interval);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, phase, interval, enabled, saveToLocalStorage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};

export default useAutoSave;

