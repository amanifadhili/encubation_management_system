import React from 'react';
import { formatDate, formatDateRange } from '../../utils/formatters';

export interface ReportHeaderProps {
  /** Company or organization name */
  companyName: string;
  /** Main report title (e.g., "Payroll Sheet", "Bank Payment") */
  reportTitle: string;
  /** Date range for the report */
  dateRange?: {
    start: string | Date;
    end: string | Date;
  };
  /** Additional report type/subtitle (e.g., "Permanent staff", "Monthly Report") */
  reportType?: string;
  /** Export/generation date (defaults to current date) */
  exportDate?: string | Date;
  /** Additional className for customization */
  className?: string;
}

/**
 * Professional report header component
 * Displays company name, report title, date range, and export date
 * Matches the styling from reference files (tax.blade.php, bank.blade.php)
 */
const ReportHeader: React.FC<ReportHeaderProps> = ({
  companyName,
  reportTitle,
  dateRange,
  reportType,
  exportDate = new Date(),
  className = '',
}) => {
  const formattedDateRange = dateRange
    ? formatDateRange(dateRange.start, dateRange.end)
    : null;
  const formattedExportDate = formatDate(exportDate, 'short');

  return (
    <div
      className={`flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between border border-gray-300 rounded-md p-3 bg-gray-50 export-header print:border-gray-900 print:bg-gray-50 ${className}`}
    >
      <div>
        <div className="text-lg font-semibold text-gray-900">{companyName}</div>
        {formattedDateRange && (
          <div className="text-sm font-semibold text-gray-800">
            {reportTitle} - {formattedDateRange}
          </div>
        )}
        {!formattedDateRange && (
          <div className="text-sm font-semibold text-gray-800">{reportTitle}</div>
        )}
        {reportType && (
          <div className="text-sm font-semibold text-gray-800">{reportType}</div>
        )}
      </div>
      <div className="text-xs font-semibold text-gray-800 sm:text-right w-full sm:w-auto text-right export-date">
        {formattedExportDate}
      </div>
    </div>
  );
};

export default ReportHeader;

