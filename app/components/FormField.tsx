/**
 * Form Field Component
 * Wrapper for form inputs with error display and auto-focus support
 */
import React, { useRef, useEffect } from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  children: React.ReactNode;
  autoFocus?: boolean;
  helperText?: string;
}

export function FormField({ 
  label, 
  name, 
  error, 
  touched, 
  required,
  children,
  autoFocus,
  helperText
}: FormFieldProps) {
  const hasError = touched && error;
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
    <div ref={containerRef} className="mb-4">
      <label 
        htmlFor={name} 
        className="block mb-1 font-semibold text-blue-800"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className={`relative ${hasError ? 'ring-2 ring-red-400 rounded' : ''}`}>
        {children}
      </div>
      
      {hasError && (
        <div className="flex items-center mt-1 text-red-600 text-sm">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {!hasError && helperText && (
        <p className="mt-1 text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  );
}
