/**
 * Error Handler Utility
 * Centralized error parsing and handling for HTTP responses
 */

export interface ErrorDetails {
  status: number;
  code?: string;
  message: string;
  userMessage: string;
  shouldRetry: boolean;
  retryAfter?: number;
  details?: any;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface NotFoundDetails {
  resourceType: string;
  resourceId?: string | number;
  message: string;
  suggestions?: string[];
}

export interface ConflictDetails {
  field?: string;
  value?: any;
  existingResource?: any;
  conflictType?: 'duplicate' | 'version' | 'state' | 'concurrent';
  message: string;
}

export interface PermissionDetails {
  action?: string;
  resource?: string;
  requiredRole?: string | string[];
  currentRole?: string;
  message: string;
}

export interface TimeoutDetails {
  operation?: string;
  timeoutDuration?: number;
  message: string;
  canRetry: boolean;
}

export interface ServiceUnavailableDetails {
  service?: string;
  estimatedRestoreTime?: Date | null;
  retryAfter?: number;
  message: string;
}

export class ErrorHandler {
  /**
   * Parse error from axios response and return structured error details
   * @param error - Axios error object
   * @returns ErrorDetails object with parsed information
   */
  static parse(error: any): ErrorDetails {
    const status = error.response?.status || 500;
    const data = error.response?.data || {};
    
    return {
      status,
      code: data.code,
      message: data.message || error.message || 'An error occurred',
      userMessage: this.getUserMessage(status, data),
      shouldRetry: this.canRetry(status),
      retryAfter: this.getRetryDelay(status, error.response?.headers),
      details: data.details || data.errors,
      field: data.field
    };
  }

  /**
   * Generate user-friendly message based on status code
   * @param status - HTTP status code
   * @param data - Response data from backend
   * @returns User-friendly error message
   */
  private static getUserMessage(status: number, data: any): string {
    // Use backend message if available and not a 500 error
    if (data.message && status !== 500) {
      return data.message;
    }

    // Default messages based on status code
    switch (status) {
      case 400:
        return 'Invalid input. Please check your data and try again.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists. Please use a different name.';
      case 413:
        return 'The file you\'re trying to upload is too large.';
      case 422:
        return data.message || 'The data is valid but cannot be processed due to business logic constraints.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'A server error occurred. Please try again or contact support if the problem persists.';
      case 503:
        return 'The service is temporarily unavailable. Please try again in a moment.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Check if error is retryable based on status code
   * @param status - HTTP status code
   * @returns true if error should be retried
   */
  private static canRetry(status: number): boolean {
    // Retry for: Request Timeout, Too Many Requests, Server Errors
    // Do NOT retry 422 - business logic errors won't resolve with retry
    return [408, 429, 500, 502, 503, 504].includes(status);
  }

  /**
   * Get retry delay in milliseconds based on status and headers
   * @param status - HTTP status code
   * @param headers - Response headers
   * @returns Delay in milliseconds
   */
  private static getRetryDelay(status: number, headers?: any): number {
    // Check for Retry-After header (in seconds)
    if (status === 429 && headers?.['retry-after']) {
      return parseInt(headers['retry-after']) * 1000;
    }
    
    // Default delays based on status
    if (status === 503) return 5000; // 5 seconds for service unavailable
    return 1000; // 1 second for other retryable errors
  }

  /**
   * Extract validation errors from 400 response
   * @param errorDetails - Parsed error details
   * @returns Array of validation errors with field and message
   */
  static parseValidationErrors(errorDetails: ErrorDetails): ValidationError[] {
    if (errorDetails.status !== 400 || !errorDetails.details) {
      return [];
    }

    // Handle array format: [{field: 'email', message: '...'}]
    if (Array.isArray(errorDetails.details)) {
      return errorDetails.details.map((err: any) => ({
        field: err.field || 'unknown',
        message: err.message || 'Invalid value',
        value: err.value
      }));
    }

    // Handle object format: {email: 'Invalid email', password: 'Too short'}
    if (typeof errorDetails.details === 'object') {
      return Object.entries(errorDetails.details).map(([field, message]) => ({
        field,
        message: String(message)
      }));
    }

    // Handle single field error
    if (errorDetails.field) {
      return [{
        field: errorDetails.field,
        message: errorDetails.message
      }];
    }

    return [];
  }

  /**
   * Check if error is a network error (no response from server)
   * @param error - Axios error object
   * @returns true if network error
   */
  static isNetworkError(error: any): boolean {
    return !error.response && error.request;
  }

  /**
   * Get error category for analytics and logging
   * @param status - HTTP status code
   * @returns Error category string
   */
  static getErrorCategory(status: number): string {
    if (status >= 400 && status < 500) return 'client_error';
    if (status >= 500) return 'server_error';
    return 'unknown';
  }

  /**
   * Format field name from snake_case to Title Case
   * @param field - Field name in snake_case
   * @returns Formatted field name
   */
  static formatFieldName(field: string): string {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Parse 404 Not Found error details
   * @param errorDetails - Parsed error details
   * @param defaultResourceType - Default resource type if not in error
   * @returns NotFoundDetails object
   */
  static parseNotFoundError(
    errorDetails: ErrorDetails,
    defaultResourceType: string = 'Resource'
  ): NotFoundDetails {
    const data = errorDetails.details || {};
    
    return {
      resourceType: data.resourceType || defaultResourceType,
      resourceId: data.resourceId || data.id,
      message: errorDetails.message || errorDetails.userMessage,
      suggestions: data.suggestions || this.getDefaultNotFoundSuggestions()
    };
  }

  /**
   * Get default suggestions for 404 errors
   * @returns Array of suggestion strings
   */
  private static getDefaultNotFoundSuggestions(): string[] {
    return [
      'Check if the resource ID is correct',
      'Verify the resource hasn\'t been deleted',
      'Try refreshing the page',
      'Return to the list view'
    ];
  }

  /**
   * Parse 409 Conflict error details
   * @param errorDetails - Parsed error details
   * @returns ConflictDetails object
   */
  static parseConflictError(errorDetails: ErrorDetails): ConflictDetails {
    const data = errorDetails.details || {};
    
    return {
      field: data.field || errorDetails.field,
      value: data.value,
      existingResource: data.existingResource || data.existing,
      conflictType: data.conflictType || this.inferConflictType(errorDetails.message),
      message: errorDetails.message || errorDetails.userMessage
    };
  }

  /**
   * Infer conflict type from error message
   * @param message - Error message
   * @returns Conflict type
   */
  private static inferConflictType(message: string): 'duplicate' | 'version' | 'state' | 'concurrent' {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('already exists') || lowerMessage.includes('duplicate')) {
      return 'duplicate';
    }
    if (lowerMessage.includes('version') || lowerMessage.includes('outdated')) {
      return 'version';
    }
    if (lowerMessage.includes('state') || lowerMessage.includes('status')) {
      return 'state';
    }
    if (lowerMessage.includes('concurrent') || lowerMessage.includes('modified')) {
      return 'concurrent';
    }
    
    return 'duplicate'; // default
  }

  /**
   * Check if error is a 404 Not Found
   * @param error - Axios error or ErrorDetails
   * @returns true if 404 error
   */
  static isNotFound(error: any): boolean {
    const status = error.status || error.response?.status;
    return status === 404;
  }

  /**
   * Check if error is a 409 Conflict
   * @param error - Axios error or ErrorDetails
   * @returns true if 409 error
   */
  static isConflict(error: any): boolean {
    const status = error.status || error.response?.status;
    return status === 409;
  }

  /**
   * Check if error is a 422 Unprocessable Entity
   * @param error - Axios error or ErrorDetails
   * @returns true if 422 error
   */
  static isUnprocessableEntity(error: any): boolean {
    const status = error.status || error.response?.status;
    return status === 422;
  }

  /**
   * Parse 422 Unprocessable Entity error details
   * @param errorDetails - Parsed error details
   * @returns Business logic error details
   */
  static parseBusinessLogicError(errorDetails: ErrorDetails): {
    field?: string;
    value?: any;
    constraint: string;
    message: string;
  } {
    const data = errorDetails.details || {};
    
    return {
      field: data.field || errorDetails.field,
      value: data.value,
      constraint: data.constraint || errorDetails.code || 'BUSINESS_RULE_VIOLATION',
      message: errorDetails.message || errorDetails.userMessage
    };
  }

  /**
   * Parse 403 Forbidden error details
   * @param errorDetails - Parsed error details
   * @param currentRole - Current user's role
   * @returns PermissionDetails object
   */
  static parsePermissionError(
    errorDetails: ErrorDetails,
    currentRole?: string
  ): PermissionDetails {
    const data = errorDetails.details || {};
    
    return {
      action: data.action || 'perform this action',
      resource: data.resource || data.resourceType,
      requiredRole: data.requiredRole || data.required_role,
      currentRole: currentRole || data.currentRole || data.current_role,
      message: errorDetails.message || errorDetails.userMessage
    };
  }

  /**
   * Check if error is a 403 Forbidden
   * @param error - Axios error or ErrorDetails
   * @returns true if 403 error
   */
  static isForbidden(error: any): boolean {
    const status = error.status || error.response?.status;
    return status === 403;
  }

  /**
   * Check if error is a 401 Unauthorized
   * @param error - Axios error or ErrorDetails
   * @returns true if 401 error
   */
  static isUnauthorized(error: any): boolean {
    const status = error.status || error.response?.status;
    return status === 401;
  }

  /**
   * Get error severity level for UI display
   * @param status - HTTP status code
   * @returns Severity level: 'error' | 'warning' | 'info'
   */
  static getSeverity(status: number): 'error' | 'warning' | 'info' {
    if (status >= 500) return 'error';
    if (status === 403 || status === 401) return 'error';
    if (status === 404 || status === 409 || status === 422) return 'warning';
    if (status >= 400) return 'warning';
    return 'info';
  }

  /**
   * Parse 408 Request Timeout error details
   * @param errorDetails - Parsed error details
   * @returns TimeoutDetails object
   */
  static parseTimeoutError(errorDetails: ErrorDetails): TimeoutDetails {
    const data = errorDetails.details || {};
    
    return {
      operation: data.operation || 'request',
      timeoutDuration: data.timeout || data.timeoutDuration,
      message: errorDetails.message || errorDetails.userMessage,
      canRetry: true
    };
  }

  /**
   * Parse 503 Service Unavailable error details
   * @param errorDetails - Parsed error details
   * @returns ServiceUnavailableDetails object
   */
  static parseServiceUnavailableError(errorDetails: ErrorDetails): ServiceUnavailableDetails {
    const data = errorDetails.details || {};
    const retryAfter = errorDetails.retryAfter;
    
    let estimatedRestoreTime: Date | null = null;
    if (retryAfter) {
      estimatedRestoreTime = new Date(Date.now() + retryAfter);
    } else if (data.estimatedRestoreTime) {
      estimatedRestoreTime = new Date(data.estimatedRestoreTime);
    }
    
    return {
      service: data.service || 'service',
      estimatedRestoreTime,
      retryAfter,
      message: errorDetails.message || errorDetails.userMessage
    };
  }

  /**
   * Check if error is a timeout error (408)
   * @param error - Axios error or ErrorDetails
   * @returns true if timeout error
   */
  static isTimeout(error: any): boolean {
    const status = error.status || error.response?.status;
    return (
      status === 408 ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT'
    );
  }

  /**
   * Check if error is a service unavailable error (503)
   * @param error - Axios error or ErrorDetails
   * @returns true if service unavailable
   */
  static isServiceUnavailable(error: any): boolean {
    const status = error.status || error.response?.status;
    return status === 503;
  }

  /**
   * Check if error is a 413 Payload Too Large
   * @param error - Axios error or ErrorDetails
   * @returns true if payload too large
   */
  static isPayloadTooLarge(error: any): boolean {
    const status = error.status || error.response?.status;
    return status === 413;
  }

  /**
   * Parse 413 file size error details
   * @param errorDetails - Parsed error details
   * @returns File size error details
   */
  static parseFileSizeError(errorDetails: ErrorDetails): {
    fileName?: string;
    fileSize?: number;
    maxSize?: number;
    message: string;
  } {
    const data = errorDetails.details || {};
    return {
      fileName: data.fileName,
      fileSize: data.fileSize,
      maxSize: data.maxSize || data.limit,
      message: errorDetails.message || errorDetails.userMessage
    };
  }

  /**
   * Check if error should be retried
   * @param error - Axios error or ErrorDetails
   * @returns true if error is retryable
   */
  static isRetryable(error: any): boolean {
    const status = error.status || error.response?.status;
    return (
      status === 408 ||
      status === 429 ||
      status === 500 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      this.isTimeout(error)
    );
  }

  /**
   * Format duration in milliseconds to human readable string
   * @param ms - Duration in milliseconds
   * @returns Formatted duration string
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  }

  /**
   * Comprehensive error handler that displays appropriate message for ALL status codes
   * @param error - Axios error object
   * @param showToast - Toast notification function
   * @param context - Optional context for custom messages (e.g., 'saving project', 'deleting user')
   * @returns ErrorDetails object
   */
  static handleError(
    error: any,
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void,
    context?: string
  ): ErrorDetails {
    console.error(`Error ${context ? `during ${context}` : ''}:`, error);
    
    // Check for network error first (no response from server)
    if (this.isNetworkError(error)) {
      showToast(
        'Cannot connect to server. Please check if the backend is running.',
        'error'
      );
      return {
        status: 0,
        message: 'Network error',
        userMessage: 'Cannot connect to server',
        shouldRetry: true,
        retryAfter: 3000
      };
    }

    // Parse the error details
    const errorDetails = this.parse(error);
    const status = errorDetails.status;

    // Get appropriate toast type based on severity
    const toastType = this.getToastType(status);
    
    // Handle specific status codes with custom logic
    switch (status) {
      case 400: // Bad Request - Validation errors
        showToast(errorDetails.userMessage, 'error');
        break;

      case 401: // Unauthorized - Session expired
        showToast('Your session has expired. Please log in again.', 'error');
        // Token will be cleared by API interceptor
        break;

      case 403: // Forbidden - No permission
        showToast(errorDetails.userMessage, 'error');
        break;

      case 404: // Not Found
        showToast(errorDetails.userMessage, 'warning');
        break;

      case 408: // Request Timeout
        showToast('Request timed out. Please try again.', 'warning');
        break;

      case 409: // Conflict - Duplicate resource
        showToast(errorDetails.userMessage, 'warning');
        break;

      case 413: // Payload Too Large
        showToast(errorDetails.userMessage, 'error');
        break;

      case 422: // Unprocessable Entity - Business logic error
        showToast(errorDetails.userMessage, 'warning');
        break;

      case 429: // Too Many Requests - Rate limited
        const retryAfterMsg = errorDetails.retryAfter 
          ? ` Please wait ${this.formatDuration(errorDetails.retryAfter)} before trying again.`
          : ' Please wait a moment before trying again.';
        showToast(`Too many requests.${retryAfterMsg}`, 'warning');
        break;

      case 500: // Internal Server Error
        showToast(
          'A server error occurred. Please try again or contact support if the problem persists.',
          'error'
        );
        break;

      case 502: // Bad Gateway
        showToast('Server is temporarily unavailable. Please try again in a moment.', 'error');
        break;

      case 503: // Service Unavailable
        showToast('Service is temporarily unavailable. Please try again later.', 'error');
        break;

      case 504: // Gateway Timeout
        showToast('Server took too long to respond. Please try again.', 'error');
        break;

      default:
        // For any other status codes, use the parsed user message
        showToast(errorDetails.userMessage, toastType);
    }

    return errorDetails;
  }

  /**
   * Get appropriate toast type based on HTTP status code
   * @param status - HTTP status code
   * @returns Toast type
   */
  private static getToastType(status: number): 'error' | 'warning' | 'info' {
    if (status >= 500) return 'error';
    if (status === 401 || status === 403) return 'error';
    if (status === 404 || status === 409 || status === 422 || status === 429) return 'warning';
    if (status >= 400) return 'warning';
    return 'info';
  }
}
