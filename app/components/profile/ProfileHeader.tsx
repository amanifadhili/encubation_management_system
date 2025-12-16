import React from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import { PencilIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../Button';

interface ProfileHeaderProps {
  onEditClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onEditClick }) => {
  const { profile, completion } = useProfile();
  const { user } = useAuth();

  const getDisplayName = (): string => {
    if (profile?.first_name && profile?.last_name) {
      const middle = profile.middle_name ? ` ${profile.middle_name} ` : ' ';
      return `${profile.first_name}${middle}${profile.last_name}`;
    }
    return profile?.name || user?.name || 'User';
  };

  const getInitials = (): string => {
    const displayName = getDisplayName();
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const getAvatarUrl = (): string | null => {
    return profile?.profile_photo_url || null;
  };

  const completionPercentage = completion?.percentage || 0;
  const isComplete = completionPercentage === 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {getAvatarUrl() ? (
            <div className="relative">
              <img
                src={getAvatarUrl()!}
                alt={getDisplayName()}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 shadow-md"
              />
              {isComplete && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-100 shadow-md">
                {getInitials()}
              </div>
              {isComplete && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 truncate">
              {getDisplayName()}
            </h2>
            {isComplete && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                <CheckCircleIcon className="w-4 h-4" />
                Complete
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-3">{profile?.email || user?.email}</p>
          
          {/* Completion Percentage */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Profile Completion
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {completionPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    completionPercentage === 100
                      ? 'bg-green-500'
                      : completionPercentage >= 75
                      ? 'bg-blue-500'
                      : completionPercentage >= 50
                      ? 'bg-yellow-500'
                      : completionPercentage >= 25
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <div className="flex-shrink-0">
          {onEditClick && (
            <Button
              variant="secondary"
              onClick={onEditClick}
              className="flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;

