/**
 * Rate Limit Notice Component
 * Displays when user hits rate limits (429 Too Many Requests)
 */
import React, { useState, useEffect } from 'react';
import Button from './Button';
import { ErrorHandler } from '../utils/errorHandler';

export interface RateLimitDetails {
  retryAfter?: number; // seconds or milliseconds
  limit?: number;
  remaining?: number;
  resetTime?: Date;
  message?: string;
}

export interface RateLimitNoticeProps {
  details: RateLimitDetails;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function RateLimitNotice({
  details,
  onRetry,
  onDismiss,
  className = ''
}: RateLimitNoticeProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (details.retryAfter) {
      // Convert to milliseconds if needed
      const retryMs = details.retryAfter > 1000000
        ? details.retryAfter
        : details.retryAfter * 1000;
      
      setTimeRemaining(retryMs);

      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1000) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [details.retryAfter]);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return 'now';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const canRetry = timeRemaining <= 0;

  return (
    <div className={`bg-orange-50 border-l-4 border-orange-400 p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-start">
        {/* Clock Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-10 w-10 text-orange-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="ml-4 flex-1">
          {/* Title */}
          <h3 className="text-xl font-bold text-orange-800 mb-2">
            Rate Limit Reached
          </h3>

          {/* Message */}
          <p className="text-orange-700 mb-4">
            {details.message || "You've made too many requests. Please wait before trying again."}
          </p>

          {/* Rate Limit Info */}
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-orange-900 mb-2">Rate Limit Details:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {details.limit && (
                <div className="flex items-center text-orange-800">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                  </svg>
                  <span>
                    <span className="font-medium">Request Limit:</span> {details.limit}/hour
                  </span>
                </div>
              )}
              {details.remaining !== undefined && (
                <div className="flex items-center text-orange-800">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <span className="font-medium">Remaining:</span> {details.remaining}
                  </span>
                </div>
              )}
              {timeRemaining > 0 && (
                <div className="flex items-center text-orange-800">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <span className="font-medium">Retry In:</span> {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              {details.resetTime && (
                <div className="flex items-center text-orange-800">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <span className="font-medium">Resets At:</span> {details.resetTime.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white border border-orange-200 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-orange-900 mb-2">What can you do?</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
              <li>Wait for the rate limit to reset</li>
              <li>Reduce the frequency of your requests</li>
              <li>Consider upgrading to a higher tier (if available)</li>
              <li>Contact support if you need a higher limit</li>
            </ul>
          </div>

          {/* Countdown Bar */}
          {timeRemaining > 0 && details.retryAfter && (
            <div className="mb-4">
              <div className="bg-orange-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full transition-all duration-1000"
                  style={{
                    width: `${100 - (timeRemaining / (details.retryAfter > 1000000 ? details.retryAfter : details.retryAfter * 1000)) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {onDismiss && (
              <Button
                variant="secondary"
                onClick={onDismiss}
                className="bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
              >
                Dismiss
              </Button>
            )}
            {onRetry && (
              <Button
                onClick={onRetry}
                disabled={!canRetry}
                className={`${
                  canRetry
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canRetry ? '🔄 Retry Now' : `⏳ Wait ${formatTime(timeRemaining)}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Parse rate limit error from ErrorHandler
 */
export function parseRateLimitError(error: any): RateLimitDetails {
  const errorDetails = ErrorHandler.parse(error);
  const data = errorDetails.details || {};
  
  // Extract Retry-After header (seconds or HTTP date)
  let retryAfter: number | undefined;
  if (errorDetails.retryAfter) {
    retryAfter = errorDetails.retryAfter;
  } else if (data.retry_after) {
    retryAfter = parseInt(data.retry_after) * 1000;
  }
  
  // Extract rate limit headers
  const limit = data.limit || data['x-ratelimit-limit'];
  const remaining = data.remaining || data['x-ratelimit-remaining'];
  const reset = data.reset || data['x-ratelimit-reset'];
  
  let resetTime: Date | undefined;
  if (reset) {
    // Could be Unix timestamp or ISO date
    resetTime = new Date(isNaN(reset) ? reset : reset * 1000);
  }
  
  return {
    retryAfter,
    limit: limit ? parseInt(limit) : undefined,
    remaining: remaining ? parseInt(remaining) : undefined,
    resetTime,
    message: errorDetails.message || errorDetails.userMessage
  };
}

export default RateLimitNotice;
