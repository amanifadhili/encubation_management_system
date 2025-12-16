import React, { useEffect, useState } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export const AutoSaveIndicator: React.FC = () => {
  const { saving, lastSaved } = useProfile();
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (lastSaved && !saving) {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 3000); // Show for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [lastSaved, saving]);

  if (saving) {
    return (
      <div className="flex items-center gap-2 text-blue-600 animate-pulse">
        <ClockIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Saving...</span>
      </div>
    );
  }

  if (showSaved && lastSaved) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircleIcon className="w-4 h-4" />
        <span className="text-sm font-medium">
          Saved {formatTimeAgo(lastSaved)}
        </span>
      </div>
    );
  }

  return null;
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  return 'recently';
};

export default AutoSaveIndicator;

