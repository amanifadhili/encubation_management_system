import React from 'react';

export interface ReportContainerProps {
  /** Unique ID for the report container (used for export targeting) */
  exportId: string;
  /** Child components (report content) */
  children: React.ReactNode;
  /** Additional className for customization */
  className?: string;
}

/**
 * Report container component
 * Wraps report content with proper styling and export ID
 * Provides consistent container styling for all reports
 * Matches the styling from reference files
 */
const ReportContainer: React.FC<ReportContainerProps> = ({
  exportId,
  children,
  className = '',
}) => {
  return (
    <div
      id={exportId}
      className={`bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 space-y-4 print:shadow-none print:border-0 print:p-0 ${className}`}
    >
      {children}
    </div>
  );
};

export default ReportContainer;

