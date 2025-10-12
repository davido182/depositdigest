import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorHandlingService } from '@/services/ErrorHandlingService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorHandlingService: ErrorHandlingService;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    };
    this.errorHandlingService = ErrorHandlingService.getInstance();
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID(),
      retryCount: 0
    };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with context
    await this.errorHandlingService.handleError(error, {
      component: 'ErrorBoundary',
      action: 'component_error',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    }, { severity: 'high' });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = async () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));

      // Log retry attempt
      if (this.state.error) {
        await this.errorHandlingService.handleError(this.state.error, {
          component: 'ErrorBoundary',
          action: 'retry_attempt',
          metadata: {
            retryCount: retryCount + 1,
            maxRetries: this.maxRetries
          }
        }, { severity: 'low' });
      }
    }
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReportBug = () => {
    const { error, errorId } = this.state;
    
    if (error && errorId) {
      // In production, this would open a bug report form or send to support
      const bugReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      console.log('Bug report data:', bugReport);
      
      // For now, copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2))
        .then(() => alert('Error details copied to clipboard'))
        .catch(() => alert('Error ID: ' + errorId));
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;
      const errorMessage = error?.message || 'An unexpected error occurred';

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600">
                We encountered an unexpected error. Don't worry, we're working to fix it.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-3 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">Error Details:</p>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Retry Information */}
              {retryCount > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    Retry attempt {retryCount} of {this.maxRetries}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
                
                <Button 
                  onClick={this.handleReportBug}
                  className="w-full"
                  variant="ghost"
                  size="sm"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  If the problem persists, please contact support with the error ID above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const errorHandlingService = ErrorHandlingService.getInstance();

  const handleError = React.useCallback(async (
    error: Error,
    context?: {
      component?: string;
      action?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    await errorHandlingService.handleError(error, {
      component: context?.component || 'UnknownComponent',
      action: context?.action || 'unknown_action',
      metadata: context?.metadata
    });
  }, [errorHandlingService]);

  const handleAsyncError = React.useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    context?: {
      component?: string;
      action?: string;
      fallbackValue?: T;
    }
  ): Promise<T | undefined> => {
    try {
      return await asyncOperation();
    } catch (error) {
      await handleError(error as Error, context);
      return context?.fallbackValue;
    }
  }, [handleError]);

  return { handleError, handleAsyncError };
}