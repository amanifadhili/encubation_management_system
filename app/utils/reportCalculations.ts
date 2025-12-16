/**
 * Utility functions for calculating totals and aggregations in reports
 */

/**
 * Calculate grand totals for numeric columns in a dataset
 * @param data - Array of data objects
 * @param columns - Array of column keys to calculate totals for
 * @returns Object with totals for each column
 */
export function calculateGrandTotals<T extends Record<string, any>>(
  data: T[],
  columns: string[]
): Record<string, number> {
  const totals: Record<string, number> = {};

  columns.forEach((column) => {
    totals[column] = data.reduce((sum, row) => {
      const value = row[column];
      if (typeof value === 'number') {
        return sum + value;
      }
      // Try to parse string numbers
      if (typeof value === 'string') {
        const num = parseFloat(value.replace(/,/g, ''));
        return sum + (isNaN(num) ? 0 : num);
      }
      return sum;
    }, 0);
  });

  return totals;
}

/**
 * Calculate totals with custom aggregation functions
 * @param data - Array of data objects
 * @param aggregations - Object mapping column keys to aggregation functions
 * @returns Object with aggregated values
 */
export function calculateCustomTotals<T extends Record<string, any>>(
  data: T[],
  aggregations: Record<string, (values: any[]) => number>
): Record<string, number> {
  const totals: Record<string, number> = {};

  Object.entries(aggregations).forEach(([column, aggregateFn]) => {
    const values = data.map((row) => row[column]);
    totals[column] = aggregateFn(values);
  });

  return totals;
}

/**
 * Calculate sum of numeric values
 */
export function sum(values: any[]): number {
  return values.reduce((acc, val) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '')) || 0;
    return acc + num;
  }, 0);
}

/**
 * Calculate average of numeric values
 */
export function average(values: any[]): number {
  const filtered = values.filter(v => v != null && v !== '');
  if (filtered.length === 0) return 0;
  return sum(filtered) / filtered.length;
}

/**
 * Calculate minimum value
 */
export function min(values: any[]): number {
  const numbers = values
    .map(v => typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, '')) || Infinity)
    .filter(v => !isNaN(v) && v !== Infinity);
  return numbers.length > 0 ? Math.min(...numbers) : 0;
}

/**
 * Calculate maximum value
 */
export function max(values: any[]): number {
  const numbers = values
    .map(v => typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, '')) || -Infinity)
    .filter(v => !isNaN(v) && v !== -Infinity);
  return numbers.length > 0 ? Math.max(...numbers) : 0;
}

/**
 * Count non-null/non-empty values
 */
export function count(values: any[]): number {
  return values.filter(v => v != null && v !== '' && v !== '-').length;
}

/**
 * Calculate multiple totals for a dataset
 * Supports sum, average, min, max, count for different columns
 */
export interface TotalConfig {
  /** Column key */
  column: string;
  /** Aggregation type */
  type: 'sum' | 'average' | 'min' | 'max' | 'count';
  /** Custom formatter function (optional) */
  format?: (value: number) => string | number;
}

/**
 * Calculate totals based on configuration
 */
export function calculateTotals<T extends Record<string, any>>(
  data: T[],
  config: TotalConfig[]
): Record<string, number | string> {
  const totals: Record<string, number | string> = {};

  config.forEach(({ column, type, format }) => {
    const values = data.map((row) => row[column]);

    let result: number;
    switch (type) {
      case 'sum':
        result = sum(values);
        break;
      case 'average':
        result = average(values);
        break;
      case 'min':
        result = min(values);
        break;
      case 'max':
        result = max(values);
        break;
      case 'count':
        result = count(values);
        break;
      default:
        result = 0;
    }

    totals[column] = format ? format(result) : result;
  });

  return totals;
}

