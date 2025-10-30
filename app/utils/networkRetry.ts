/**
 * Network Retry Utility
 * Provides retry logic with exponential backoff for failed network requests
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, delay: number, error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalDelay: number;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise with retry result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    onRetry
  } = options;

  let lastError: any;
  let attempt = 0;
  let totalDelay = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await fn();
      return result;
    } catch (error: any) {
      lastError = error;
      attempt++;

      // Check if error is retryable
      const status = error.response?.status || error.status;
      const isRetryable = !status || retryableStatuses.includes(status);

      // Don't retry if not retryable or max retries reached
      if (!isRetryable || attempt > maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      totalDelay += delay;

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, delay, error);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry with tracking information
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise with detailed retry result
 */
export async function withRetryTracking<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let attempts = 0;
  let lastError: any;

  const onRetry = (attempt: number, delay: number, error: any) => {
    attempts = attempt;
    if (options.onRetry) {
      options.onRetry(attempt, delay, error);
    }
  };

  try {
    const data = await withRetry(fn, { ...options, onRetry });
    return {
      success: true,
      data,
      attempts: attempts || 1,
      totalDelay: Date.now() - startTime
    };
  } catch (error) {
    lastError = error;
    return {
      success: false,
      error: lastError,
      attempts: attempts || 1,
      totalDelay: Date.now() - startTime
    };
  }
}

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is a network error (no response from server)
 * @param error - Error object
 * @returns true if network error
 */
export function isNetworkError(error: any): boolean {
  return (
    !error.response &&
    (error.request ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error'))
  );
}

/**
 * Check if error is a timeout error
 * @param error - Error object
 * @returns true if timeout error
 */
export function isTimeoutError(error: any): boolean {
  const status = error.response?.status || error.status;
  return (
    status === 408 ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.includes('timeout')
  );
}

/**
 * Get recommended retry delay from error response
 * @param error - Error object
 * @returns Delay in milliseconds or null
 */
export function getRetryAfter(error: any): number | null {
  const retryAfter = error.response?.headers?.['retry-after'];
  
  if (!retryAfter) return null;
  
  // If it's a number, it's in seconds
  const seconds = parseInt(retryAfter);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }
  
  // If it's a date, calculate the difference
  const retryDate = new Date(retryAfter);
  if (!isNaN(retryDate.getTime())) {
    return Math.max(0, retryDate.getTime() - Date.now());
  }
  
  return null;
}

/**
 * Create a retry function with preset options
 * @param options - Default retry options
 * @returns Configured retry function
 */
export function createRetryFn(options: RetryOptions) {
  return <T>(fn: () => Promise<T>) => withRetry(fn, options);
}

export default {
  withRetry,
  withRetryTracking,
  isNetworkError,
  isTimeoutError,
  getRetryAfter,
  createRetryFn
};
