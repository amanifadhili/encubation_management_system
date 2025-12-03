/**
 * Upload Error Handler Component
 * Handles file upload errors including timeouts, size limits, and network issues
 */
import React from 'react';
import Button from './Button';

export interface UploadError {
  type: 'timeout' | 'size' | 'network' | 'server' | 'format';
  message: string;
  fileName?: string;
  fileSize?: number;
  maxSize?: number;
  allowedFormats?: string[];
}

export interface UploadErrorHandlerProps {
  error: UploadError | null;
  onRetry?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function UploadErrorHandler({
  error,
  onRetry,
  onCancel,
  onDismiss,
  className = ''
}: UploadErrorHandlerProps) {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'timeout':
        return '⏱️';
      case 'size':
        return '📦';
      case 'network':
        return '🌐';
      case 'server':
        return '⚠️';
      case 'format':
        return '📄';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'timeout':
        return 'Upload Timed Out';
      case 'size':
        return 'File Too Large';
      case 'network':
        return 'Network Error';
      case 'server':
        return 'Server Error';
      case 'format':
        return 'Invalid File Format';
      default:
        return 'Upload Failed';
    }
  };

  const getSuggestions = () => {
    switch (error.type) {
      case 'timeout':
        return [
          'Check your internet connection',
          'Try uploading a smaller file',
          'Try again when the network is more stable',
          'Contact support if the problem persists'
        ];
      case 'size':
        return [
          `Maximum file size is ${formatFileSize(error.maxSize || 0)}`,
          'Compress the file before uploading',
          'Split large files into smaller parts',
          'Contact support to increase your upload limit'
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try again in a moment',
          'Disable VPN if using one',
          'Contact support if the problem persists'
        ];
      case 'server':
        return [
          'The server is temporarily unavailable',
          'Try again in a few minutes',
          'Contact support if the problem persists'
        ];
      case 'format':
        return [
          `Allowed formats: ${error.allowedFormats?.join(', ') || 'See documentation'}`,
          'Convert your file to a supported format',
          'Check the file extension',
          'Contact support if you need help'
        ];
      default:
        return ['Try again', 'Contact support if the problem persists'];
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`bg-orange-50 border-l-4 border-orange-400 p-6 rounded-lg shadow-md ${className}`}>
      <div className="flex items-start">
        {/* Icon */}
        <span className="text-4xl mr-3 flex-shrink-0">{getErrorIcon()}</span>

        <div className="flex-1">
          {/* Title */}
          <h3 className="text-lg font-bold text-orange-900 mb-2">
            {getErrorTitle()}
          </h3>

          {/* Error Message */}
          <p className="text-orange-800 mb-3">
            {error.message}
          </p>

          {/* File Details */}
          {error.fileName && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mb-3">
              <div className="text-sm space-y-1">
                <p className="text-orange-900">
                  <span className="font-medium">File:</span> {error.fileName}
                </p>
                {error.fileSize !== undefined && (
                  <p className="text-orange-900">
                    <span className="font-medium">Size:</span> {formatFileSize(error.fileSize)}
                  </p>
                )}
                {error.type === 'size' && error.maxSize && (
                  <p className="text-orange-900">
                    <span className="font-medium">Maximum Allowed:</span> {formatFileSize(error.maxSize)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="bg-white border border-orange-200 rounded-lg p-3 mb-4">
            <h4 className="font-semibold text-orange-900 mb-2 text-sm">What can you do?</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
              {getSuggestions().map((suggestion, idx) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>

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
            {onRetry && error.type !== 'size' && error.type !== 'format' && (
              <Button
                onClick={onRetry}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                🔄 Retry Upload
              </Button>
            )}
            {onCancel && (
              <Button
                variant="secondary"
                onClick={onCancel}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Create an upload error object
 * @param type - Error type
 * @param message - Error message
 * @param details - Additional error details
 * @returns UploadError object
 */
export function createUploadError(
  type: UploadError['type'],
  message: string,
  details?: Partial<UploadError>
): UploadError {
  return {
    type,
    message,
    ...details
  };
}

export default UploadErrorHandler;
