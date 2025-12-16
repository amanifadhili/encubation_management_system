/**
 * Formatting utilities for professional reports
 * Provides consistent number, currency, and date formatting
 */

/**
 * Format a number as currency
 * @param value - The numeric value to format
 * @param currency - Currency symbol/prefix (default: 'RWF')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "RWF 1,234.56")
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'RWF',
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return `${currency} ${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format a number with specified decimal places
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 2
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as an integer (no decimals)
 * @param value - The numeric value to format
 * @returns Formatted integer string (e.g., "1,234")
 */
export function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return Math.round(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Format a date string or Date object
 * @param date - Date string or Date object
 * @param format - Format style: 'short' (DD/MM/YYYY), 'long' (Month DD, YYYY), or 'full' (full date string)
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: 'short' | 'long' | 'full' = 'short'
): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  switch (format) {
    case 'short':
      // DD/MM/YYYY format (matching reference files)
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    
    case 'long':
      // Month DD, YYYY format
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    
    case 'full':
      // Full date string
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    
    default:
      return dateObj.toLocaleDateString();
  }
}

/**
 * Format a date range
 * @param start - Start date (string or Date)
 * @param end - End date (string or Date)
 * @returns Formatted date range string (e.g., "From 01/01/2024 - 31/01/2024")
 */
export function formatDateRange(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  if (!start || !end) {
    return '-';
  }

  const startFormatted = formatDate(start, 'short');
  const endFormatted = formatDate(end, 'short');

  return `From ${startFormatted} - ${endFormatted}`;
}

/**
 * Format a month/year string for month picker inputs
 * @param date - Date string or Date object
 * @returns Formatted month string (YYYY-MM format for input type="month")
 */
export function formatMonthInput(date: string | Date | null | undefined): string {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format a month name from a date
 * @param date - Date string or Date object
 * @returns Month name (e.g., "January 2024")
 */
export function formatMonthName(date: string | Date | null | undefined): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Get start and end dates of a month from a YYYY-MM string
 * @param monthString - Month string in YYYY-MM format
 * @returns Object with start and end Date objects
 */
export function getMonthDateRange(monthString: string): { start: Date; end: Date } | null {
  if (!monthString || !/^\d{4}-\d{2}$/.test(monthString)) {
    return null;
  }

  const [year, month] = monthString.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // Last day of the month

  return { start, end };
}

