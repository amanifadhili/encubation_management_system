import React from 'react';
import DateRangePicker from './DateRangePicker';

export interface FilterField {
  /** Unique key for the filter */
  key: string;
  /** Label for the filter */
  label: string;
  /** Filter type */
  type: 'text' | 'number' | 'select' | 'date' | 'month' | 'daterange';
  /** Current value */
  value: any;
  /** Options for select type */
  options?: Array<{ label: string; value: string }>;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum value for number type */
  min?: number;
  /** Maximum value for number type */
  max?: number;
  /** Whether the filter is required */
  required?: boolean;
}

export interface ReportFiltersProps {
  /** Filter fields configuration */
  fields: FilterField[];
  /** Callback when any filter changes */
  onChange: (key: string, value: any) => void;
  /** Additional className */
  className?: string;
  /** Whether filters are disabled */
  disabled?: boolean;
  /** Number of columns in grid (default: 3) */
  columns?: 1 | 2 | 3 | 4;
}

/**
 * Reusable report filters component
 * Provides consistent filter styling and behavior
 * Matches styling from reference files
 */
const ReportFilters: React.FC<ReportFiltersProps> = ({
  fields,
  onChange,
  className = '',
  disabled = false,
  columns = 3,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const handleChange = (key: string, value: any) => {
    onChange(key, value);
  };

  const renderFilterField = (field: FilterField) => {
    const baseClasses =
      'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={field.value || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            required={field.required}
            className={baseClasses}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={field.value || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            disabled={disabled}
            required={field.required}
            className={baseClasses}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={field.value || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            disabled={disabled}
            required={field.required}
            className={baseClasses}
          />
        );

      case 'month':
        return (
          <DateRangePicker
            mode="month"
            month={field.value}
            onMonthChange={(month) => handleChange(field.key, month)}
            disabled={disabled}
            className=""
          />
        );

      case 'daterange':
        // For date range, value should be { start: string, end: string }
        const rangeValue = field.value || { start: '', end: '' };
        return (
          <DateRangePicker
            mode="range"
            startDate={rangeValue.start}
            endDate={rangeValue.end}
            onStartDateChange={(date) =>
              handleChange(field.key, { ...rangeValue, start: date })
            }
            onEndDateChange={(date) =>
              handleChange(field.key, { ...rangeValue, end: date })
            }
            disabled={disabled}
            className=""
          />
        );

      case 'select':
        return (
          <select
            value={field.value || ''}
            onChange={(e) => handleChange(field.key, e.target.value)}
            disabled={disabled}
            required={field.required}
            className={baseClasses}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-3 no-print ${className}`}>
      {fields.map((field) => (
        <div key={field.key} className="space-y-1">
          <label className="block text-xs font-semibold text-gray-600">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderFilterField(field)}
        </div>
      ))}
    </div>
  );
};

export default ReportFilters;

