/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */
import React, { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import Button from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send error to error logging service in production
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Something Went Wrong
            </h1>

            {/* Description */}
            <p className="text-center text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified and we're working to fix it.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Error Details (Development Mode):</h3>
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Error:</span> {this.state.error.message}
                </div>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Component Stack
                    </summary>
                    <pre className="mt-2 text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Suggestions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">What can you do?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li>Try reloading the page</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try again in a few minutes</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="secondary"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2"
              >
                Go to Home
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2"
              >
                Reload Page
              </Button>
            </div>

            {/* Error ID (for support) */}
            {this.state.error && (
              <div className="mt-6 text-center text-xs text-gray-500">
                Error ID: {Date.now().toString(36).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
