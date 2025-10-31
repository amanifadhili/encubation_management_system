/**
 * Validation Errors Component
 * Displays a summary of form validation errors with clickable field names
 */
import React from 'react';

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
    <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <span className="text-red-600 text-xl mr-2 flex-shrink-0">⚠️</span>
        <div className="flex-1">
          <h4 className="text-red-800 font-semibold mb-2">
            Please fix the following {errors.length > 1 ? 'errors' : 'error'}:
          </h4>
          <ul className="space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-red-700 text-sm">
                {onFieldFocus ? (
                  <button
                    type="button"
                    onClick={() => onFieldFocus(error.field)}
                    className="text-left hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-1"
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
