/**
 * Not Found Alert Component
 * Displays user-friendly 404 error messages with suggestions
 */
import React from 'react';
import Button from './Button';

export interface NotFoundAlertProps {
  resourceType: string;
  resourceId?: string | number;
  message?: string;
  suggestions?: string[];
  onGoBack?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function NotFoundAlert({
  resourceType,
  resourceId,
  message,
  suggestions = [],
  onGoBack,
  onRetry,
  className = ''
}: NotFoundAlertProps) {
  const defaultMessage = resourceId
    ? `The ${resourceType} with ID "${resourceId}" could not be found.`
    : `The requested ${resourceType} could not be found.`;

  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-start">
        {/* Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-8 w-8 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="ml-4 flex-1">
          {/* Title */}
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            {resourceType} Not Found
          </h3>

          {/* Message */}
          <p className="text-yellow-700 mb-4">
            {message || defaultMessage}
          </p>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-yellow-800 font-semibold mb-2">Suggestions:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {onGoBack && (
              <Button
                variant="secondary"
                onClick={onGoBack}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
              >
                ← Go Back
              </Button>
            )}
            {onRetry && (
              <Button
                onClick={onRetry}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                🔄 Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundAlert;
