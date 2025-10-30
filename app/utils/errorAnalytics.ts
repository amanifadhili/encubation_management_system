/**
 * Error Analytics Utility
 * Logs errors for debugging and sends to backend in production
 */

export interface ErrorContext {
  user?: {
    id?: number;
    role?: string;
    email?: string;
  };
  page?: string;
  action?: string;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorLogEntry {
  id: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

class ErrorAnalytics {
  private errorQueue: ErrorLogEntry[] = [];
  private readonly maxQueueSize = 50;
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log an error with context
   */
  logError(
    error: Error,
    context: ErrorContext = {},
    severity: ErrorLogEntry['severity'] = 'medium'
  ): void {
    const errorEntry: ErrorLogEntry = {
      id: this.generateErrorId(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: {
        ...context,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      severity,
      timestamp: new Date()
    };

    // Add to queue
    this.addToQueue(errorEntry);

    // Log to console in development
    if (this.isDevelopment) {
      this.logToConsole(errorEntry);
    }

    // Send to backend in production
    if (!this.isDevelopment) {
      this.sendToBackend(errorEntry);
    }
  }

  /**
   * Log a network error
   */
  logNetworkError(
    error: any,
    endpoint: string,
    method: string,
    context: ErrorContext = {}
  ): void {
    const enhancedContext: ErrorContext = {
      ...context,
      action: `${method} ${endpoint}`,
      additionalData: {
        endpoint,
        method,
        status: error.response?.status,
        statusText: error.response?.statusText
      }
    };

    const severity = this.determineNetworkErrorSeverity(error.response?.status);
    
    this.logError(
      new Error(`Network Error: ${error.message}`),
      enhancedContext,
      severity
    );
  }

  /**
   * Log a validation error
   */
  logValidationError(
    errors: Array<{ field: string; message: string }>,
    context: ErrorContext = {}
  ): void {
    const enhancedContext: ErrorContext = {
      ...context,
      action: 'Form Validation Failed',
      additionalData: { errors }
    };

    this.logError(
      new Error(`Validation failed: ${errors.length} errors`),
      enhancedContext,
      'low'
    );
  }

  /**
   * Log a React component error
   */
  logComponentError(
    error: Error,
    errorInfo: { componentStack: string },
    context: ErrorContext = {}
  ): void {
    const enhancedContext: ErrorContext = {
      ...context,
      action: 'React Component Error',
      additionalData: {
        componentStack: errorInfo.componentStack
      }
    };

    this.logError(error, enhancedContext, 'high');
  }

  /**
   * Get recent errors (for debugging)
   */
  getRecentErrors(count: number = 10): ErrorLogEntry[] {
    return this.errorQueue.slice(-count);
  }

  /**
   * Clear error queue
   */
  clearErrors(): void {
    this.errorQueue = [];
  }

  /**
   * Private: Add error to queue
   */
  private addToQueue(entry: ErrorLogEntry): void {
    this.errorQueue.push(entry);
    
    // Keep queue size limited
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Private: Log to console
   */
  private logToConsole(entry: ErrorLogEntry): void {
    const style = this.getConsoleStyle(entry.severity);
    
    console.group(`%c[Error Analytics] ${entry.severity.toUpperCase()}`, style);
    console.log('Message:', entry.error.message);
    console.log('Context:', entry.context);
    if (entry.error.stack) {
      console.log('Stack:', entry.error.stack);
    }
    console.log('Timestamp:', entry.timestamp.toISOString());
    console.log('Error ID:', entry.id);
    console.groupEnd();
  }

  /**
   * Private: Get console style for severity
   */
  private getConsoleStyle(severity: ErrorLogEntry['severity']): string {
    const styles = {
      low: 'color: #3b82f6; font-weight: bold;',
      medium: 'color: #f59e0b; font-weight: bold;',
      high: 'color: #ef4444; font-weight: bold;',
      critical: 'color: #dc2626; font-weight: bold; font-size: 14px;'
    };
    return styles[severity];
  }

  /**
   * Private: Send to backend
   */
  private async sendToBackend(entry: ErrorLogEntry): Promise<void> {
    try {
      // TODO: Implement actual backend endpoint
      // await fetch('/api/errors/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });

      // For now, just log that it would be sent
      console.log('[Error Analytics] Would send to backend:', entry.id);
    } catch (error) {
      // Silently fail - don't want error logging to cause more errors
      console.error('[Error Analytics] Failed to send error to backend:', error);
    }
  }

  /**
   * Private: Determine network error severity
   */
  private determineNetworkErrorSeverity(status?: number): ErrorLogEntry['severity'] {
    if (!status) return 'high';
    if (status >= 500) return 'critical';
    if (status === 429) return 'medium';
    if (status >= 400) return 'medium';
    return 'low';
  }

  /**
   * Private: Generate unique error ID
   */
  private generateErrorId(): string {
    return `ERR-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  }
}

// Export singleton instance
export const errorAnalytics = new ErrorAnalytics();

export default errorAnalytics;
