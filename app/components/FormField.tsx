/**
 * Form Field Component
 * Wrapper for form inputs with error display and auto-focus support
 */
import React, { useRef, useEffect } from 'react';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  children: React.ReactNode;
  autoFocus?: boolean;
  helperText?: string;
  success?: boolean;
  disabled?: boolean;
}

export function FormField({ 
  label, 
  name, 
  error, 
  touched, 
  required,
  children,
  autoFocus,
  helperText,
  success = false,
  disabled = false
}: FormFieldProps) {
  const hasError = touched && error;
  const hasSuccess = touched && success && !error;
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll and focus when this field has an error and autoFocus is true
  useEffect(() => {
    if (autoFocus && hasError && containerRef.current) {
      // Scroll the error field into view
      containerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focus the input element
      const input = containerRef.current.querySelector('input, textarea, select');
      if (input) {
        setTimeout(() => {
          (input as HTMLElement).focus();
        }, 300); // Delay to allow scroll to complete
      }
    }
  }, [autoFocus, hasError]);

  return (
    <div ref={containerRef} className="mb-4 sm:mb-5">
      <label 
        htmlFor={name} 
        className="block mb-1.5 sm:mb-2 font-semibold text-gray-700 text-sm sm:text-base"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className={`relative ${hasError ? 'ring-2 ring-red-500 rounded-xl' : hasSuccess ? 'ring-2 ring-green-500 rounded-xl' : ''}`}>
        {children}
        
        {/* Validation icons */}
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
          </div>
        )}
        
        {hasSuccess && !hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          </div>
        )}
      </div>
      
      {hasError && (
        <div className="flex items-center gap-1.5 mt-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {hasSuccess && !hasError && (
        <div className="flex items-center gap-1.5 mt-1.5 p-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
          <span>Valid</span>
        </div>
      )}
      
      {!hasError && !hasSuccess && helperText && (
        <p className="mt-1.5 text-xs sm:text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  );
}
