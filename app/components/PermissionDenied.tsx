/**
 * Permission Denied Component
 * Displays 403 Forbidden errors with role information and support options
 */
import React from 'react';
import Button from './Button';

export interface PermissionDeniedProps {
  action?: string;
  resource?: string;
  requiredRole?: string | string[];
  currentRole?: string;
  message?: string;
  onGoBack?: () => void;
  onContactSupport?: () => void;
  showContactSupport?: boolean;
  className?: string;
}

export function PermissionDenied({
  action = 'perform this action',
  resource,
  requiredRole,
  currentRole,
  message,
  onGoBack,
  onContactSupport,
  showContactSupport = true,
  className = ''
}: PermissionDeniedProps) {
  const defaultMessage = resource
    ? `You don't have permission to ${action} on ${resource}.`
    : `You don't have permission to ${action}.`;

  const formatRole = (role: string | string[] | undefined): string => {
    if (!role) return 'unknown';
    if (Array.isArray(role)) {
      return role.join(' or ');
    }
    return role;
  };

  return (
    <div className={`bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-start">
        {/* Lock Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-10 w-10 text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="ml-4 flex-1">
          {/* Title */}
          <h3 className="text-xl font-bold text-red-800 mb-2">
            Access Denied
          </h3>

          {/* Message */}
          <p className="text-red-700 mb-4 text-base">
            {message || defaultMessage}
          </p>

          {/* Role Information */}
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-red-900 mb-2">Permission Details:</h4>
            <div className="space-y-2 text-sm">
              {currentRole && (
                <div className="flex items-center text-red-800">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <span className="font-medium">Your Role:</span> {currentRole}
                  </span>
                </div>
              )}
              {requiredRole && (
                <div className="flex items-center text-red-800">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>
                    <span className="font-medium">Required Role:</span> {formatRole(requiredRole)}
                  </span>
                </div>
              )}
              {action && (
                <div className="flex items-center text-red-800">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <span className="font-medium">Action Attempted:</span> {action}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-red-900 mb-2">What can you do?</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
              <li>Verify you're using the correct account</li>
              <li>Contact your administrator to request access</li>
              {requiredRole && <li>Ask to be assigned the "{formatRole(requiredRole)}" role</li>}
              <li>Return to a page you have access to</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {onGoBack && (
              <Button
                variant="secondary"
                onClick={onGoBack}
                className="bg-red-100 hover:bg-red-200 text-red-800 border-red-300"
              >
                ← Go Back
              </Button>
            )}
            {showContactSupport && onContactSupport && (
              <Button
                onClick={onContactSupport}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                📧 Contact Support
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PermissionDenied;
