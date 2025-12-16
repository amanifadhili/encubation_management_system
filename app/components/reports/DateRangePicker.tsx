import React from 'react';
import { formatMonthName, formatMonthInput, getMonthDateRange } from '../../utils/formatters';

export type DateRangePickerMode = 'month' | 'range';

export interface DateRangePickerProps {
  /** Selected month (YYYY-MM format) for month mode */
  month?: string;
  /** Start date for range mode */
  startDate?: string;
  /** End date for range mode */
  endDate?: string;
  /** Picker mode */
  mode?: DateRangePickerMode;
  /** Callback when month changes (month mode) */
  onMonthChange?: (month: string) => void;
  /** Callback when start date changes (range mode) */
  onStartDateChange?: (date: string) => void;
  /** Callback when end date changes (range mode) */
  onEndDateChange?: (date: string) => void;
  /** Label for the picker */
  label?: string;
  /** Additional className */
  className?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

/**
 * Date range picker component for reports
 * Supports both month picker (for monthly reports) and date range picker (for custom ranges)
 * Matches styling from reference files
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  month,
  startDate,
  endDate,
  mode = 'month',
  onMonthChange,
  onStartDateChange,
  onEndDateChange,
  label = mode === 'month' ? 'Month' : 'Date Range',
  className = '',
  disabled = false,
}) => {
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMonthChange?.(e.target.value);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStartDateChange?.(e.target.value);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEndDateChange?.(e.target.value);
  };

  if (mode === 'month') {
    return (
      <div className={`space-y-1 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          type="month"
          value={month || formatMonthInput(new Date())}
          onChange={handleMonthChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {month && (
          <div className="text-xs text-gray-500 mt-1">
            {formatMonthName(month)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">From</label>
          <input
            type="date"
            value={startDate || ''}
            onChange={handleStartDateChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-600 mb-1">To</label>
          <input
            type="date"
            value={endDate || ''}
            onChange={handleEndDateChange}
            disabled={disabled}
            min={startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;

