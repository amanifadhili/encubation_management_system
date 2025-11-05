/**
 * Validation Errors Component
 * Displays a summary of form validation errors with clickable field names
 */
import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

interface ValidationErrorsProps {
  errors: ValidationError[];
  onFieldFocus?: (field: string) => void;
}

export function ValidationErrors({ errors, onFieldFocus }: ValidationErrorsProps) {
  if (!errors || errors.length === 0) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <ExclamationCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-red-800 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
            Please fix the following {errors.length > 1 ? 'errors' : 'error'}:
          </h4>
          <ul className="space-y-1.5 sm:space-y-2">
            {errors.map((error, idx) => (
              <li key={idx} className="text-red-700 text-sm sm:text-base">
                {onFieldFocus ? (
                  <button
                    type="button"
                    onClick={() => onFieldFocus(error.field)}
                    className="text-left hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-1 transition-colors"
                  >
                    {formatFieldName(error.field)}
                  </button>
                ) : (
                  <span className="font-medium">{formatFieldName(error.field)}</span>
                )}
                : {error.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Format field name from snake_case to Title Case
 * Examples: "team_name" -> "Team Name", "email" -> "Email"
 */
function formatFieldName(field: string): string {
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
