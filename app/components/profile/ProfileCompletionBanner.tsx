import React from 'react';
import { Link } from 'react-router';
import { useProfile } from '../../context/ProfileContext';
import { CheckCircleIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ProfileCompletionBannerProps {
  onDismiss?: () => void;
  showOnComplete?: boolean;
}

export const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({
  onDismiss,
  showOnComplete = false,
}) => {
  const { completion } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  if (!completion || dismissed) {
    return null;
  }

  const percentage = completion.percentage;
  const isComplete = percentage === 100;

  // Don't show if complete and showOnComplete is false
  if (isComplete && !showOnComplete) {
    return null;
  }

  // Only show banner if completion is less than 100% (or if showOnComplete is true)
  if (!isComplete && percentage >= 100) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (isComplete) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-green-900 mb-1">
                🎉 Profile Complete!
              </h3>
              <p className="text-sm text-green-700 mb-3">
                Your profile is 100% complete. You have access to all features!
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                View Profile
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
              aria-label="Dismiss banner"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show completion banner for incomplete profiles
  const getMessage = () => {
    if (percentage < 25) {
      return {
        title: 'Complete Your Profile',
        description: 'Get started by completing your profile to unlock all features.',
        urgency: 'high',
      };
    } else if (percentage < 50) {
      return {
        title: 'Continue Your Profile',
        description: `You're ${percentage}% done. Keep going to unlock more features!`,
        urgency: 'medium',
      };
    } else if (percentage < 75) {
      return {
        title: 'Almost There!',
        description: `You're ${percentage}% complete. Finish your profile to access everything.`,
        urgency: 'low',
      };
    } else {
      return {
        title: 'Final Steps',
        description: `You're ${percentage}% complete. Just a few more steps!`,
        urgency: 'low',
      };
    }
  };

  const message = getMessage();
  const colorClasses = {
    high: 'from-red-50 to-orange-50 border-red-300',
    medium: 'from-yellow-50 to-orange-50 border-yellow-300',
    low: 'from-blue-50 to-indigo-50 border-blue-300',
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[message.urgency as keyof typeof colorClasses]} border-2 rounded-xl p-4 sm:p-6 mb-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {message.title}
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              {message.description}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Progress Bar */}
              <div className="flex-1 w-full sm:w-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    Profile Completion
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {percentage}%
                  </span>
                </div>
                <div className="w-full bg-white/60 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      percentage >= 75
                        ? 'bg-blue-500'
                        : percentage >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Complete Profile
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss banner"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCompletionBanner;

