'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  level: 'page' | 'component' | 'critical';
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError, level }: ErrorFallbackProps) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const getErrorIcon = () => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      case 'page':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      default:
        return <Bug className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (level) {
      case 'critical':
        return 'Application Error';
      case 'page':
        return 'Page Error';
      default:
        return 'Component Error';
    }
  };

  const getErrorDescription = () => {
    switch (level) {
      case 'critical':
        return 'A critical error occurred that prevents the application from functioning properly.';
      case 'page':
        return 'An error occurred while loading this page. You can try refreshing or navigate to another page.';
      default:
        return 'This component encountered an error. Other parts of the page should still work.';
    }
  };

  return (
    <Card className="mx-auto max-w-lg border-destructive/50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">{getErrorIcon()}</div>
        <CardTitle className="text-destructive">{getErrorTitle()}</CardTitle>
        <CardDescription>{getErrorDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isProduction && (
          <details className="rounded border p-2 text-sm">
            <summary className="cursor-pointer font-semibold">Error Details</summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs">{error.message}</pre>
            {error.stack && (
              <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                {error.stack}
              </pre>
            )}
          </details>
        )}
        
        <div className="flex space-x-2">
          <Button onClick={resetError} variant="outline" className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          {level === 'page' && (
            <Button onClick={() => window.location.href = '/'} variant="default" className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Main error boundary class component
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    this.logErrorToMonitoringService(error, errorInfo);
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  private logErrorToMonitoringService(error: Error, errorInfo: React.ErrorInfo) {
    // In production, this would send to a monitoring service like Sentry
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
    
    // Example: Send to monitoring service
    try {
      // window.Sentry?.captureException(error, {
      //   extra: errorInfo,
      //   tags: {
      //     boundary: this.props.level || 'component',
      //   },
      // });
    } catch (monitoringError) {
      console.error('Failed to log error to monitoring service:', monitoringError);
    }
  }

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          level={this.props.level || 'component'}
        />
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper components for different error levels
export function PageErrorBoundary({ children, onError }: { 
  children: React.ReactNode; 
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary level="page" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({ children, onError }: { 
  children: React.ReactNode; 
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary level="component" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

export function CriticalErrorBoundary({ children, onError }: { 
  children: React.ReactNode; 
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary level="critical" onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

// Hook for manual error reporting
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: string) => {
    // Log error manually
    console.error('Manual error report:', error);
    
    // Send to monitoring service
    try {
      // window.Sentry?.captureException(error, {
      //   extra: { errorInfo },
      //   tags: { source: 'manual' },
      // });
    } catch (monitoringError) {
      console.error('Failed to log manual error:', monitoringError);
    }
  }, []);
}

// Global error handler setup
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent default browser behavior
    event.preventDefault();
    
    // Send to monitoring service
    try {
      // window.Sentry?.captureException(event.reason, {
      //   tags: { type: 'unhandledrejection' },
      // });
    } catch (error) {
      console.error('Failed to log unhandled rejection:', error);
    }
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    // Send to monitoring service
    try {
      // window.Sentry?.captureException(event.error, {
      //   tags: { type: 'global' },
      //   extra: {
      //     filename: event.filename,
      //     lineno: event.lineno,
      //     colno: event.colno,
      //   },
      // });
    } catch (error) {
      console.error('Failed to log global error:', error);
    }
  });
}

// Types export for TypeScript
export type { ErrorBoundaryProps, ErrorFallbackProps };