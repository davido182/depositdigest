import { SecurityService } from './SecurityService';

export interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'authentication' | 'database' | 'ui' | 'unknown';
  resolved: boolean;
  retryCount: number;
  maxRetries: number;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private securityService: SecurityService;
  private errorQueue: ErrorReport[] = [];
  private retryQueue: Map<string, ErrorReport> = new Map();
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly DEFAULT_MAX_RETRIES = 3;

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  constructor() {
    this.securityService = SecurityService.getInstance();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Handles and categorizes errors with automatic retry logic
   */
  async handleError(
    error: Error,
    context: Partial<ErrorContext> = {},
    options: { maxRetries?: number; severity?: ErrorReport['severity'] } = {}
  ): Promise<void> {
    const errorReport: ErrorReport = {
      id: crypto.randomUUID(),
      error,
      context: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...context
      },
      severity: options.severity || this.determineSeverity(error),
      category: this.categorizeError(error),
      resolved: false,
      retryCount: 0,
      maxRetries: options.maxRetries || this.DEFAULT_MAX_RETRIES
    };

    // Log error for monitoring
    await this.logError(errorReport);

    // Add to queue for processing
    this.addToQueue(errorReport);

    // Handle based on category
    await this.processError(errorReport);
  }

  /**
   * Retries failed operations with exponential backoff
   */
  async retryOperation<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {},
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 1s, 2s, 4s, 8s...
          const delay = Math.pow(2, attempt - 1) * 1000;
          await this.delay(delay);
        }

        const result = await operation();
        
        // If we had previous failures but now succeeded, log recovery
        if (attempt > 0) {
          await this.logRecovery(context, attempt);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          // Final attempt failed
          await this.handleError(lastError, {
            ...context,
            action: 'retry_operation_failed',
            metadata: { attempts: attempt + 1, maxRetries }
          }, { severity: 'high' });
          break;
        }

        // Log retry attempt
        console.warn(`Operation failed, retrying (${attempt + 1}/${maxRetries}):`, error);
      }
    }

    throw lastError!;
  }

  /**
   * Handles network errors with automatic retry and fallback
   */
  async handleNetworkError(
    error: Error,
    originalRequest: () => Promise<any>,
    fallbackData?: any
  ): Promise<any> {
    const isNetworkError = this.isNetworkError(error);
    
    if (isNetworkError) {
      try {
        // Try to retry the request
        return await this.retryOperation(originalRequest, {
          action: 'network_retry',
          component: 'network_handler'
        });
      } catch (retryError) {
        // If retry fails and we have fallback data, use it
        if (fallbackData !== undefined) {
          await this.handleError(retryError as Error, {
            action: 'using_fallback_data',
            component: 'network_handler'
          }, { severity: 'medium' });
          
          return fallbackData;
        }
        
        throw retryError;
      }
    }
    
    throw error;
  }

  /**
   * Handles validation errors with user-friendly messages
   */
  handleValidationError(error: Error, fieldName?: string): string {
    const errorMessage = error.message.toLowerCase();
    
    // Map technical errors to user-friendly messages
    const errorMappings: Record<string, string> = {
      'required': `${fieldName || 'This field'} is required`,
      'invalid email': 'Please enter a valid email address',
      'invalid phone': 'Please enter a valid phone number',
      'too short': `${fieldName || 'This field'} is too short`,
      'too long': `${fieldName || 'This field'} is too long`,
      'already exists': `This ${fieldName || 'value'} is already in use`,
      'not found': `${fieldName || 'Item'} not found`,
      'unauthorized': 'You do not have permission to perform this action',
      'network error': 'Connection problem. Please check your internet connection and try again.',
      'server error': 'Server is temporarily unavailable. Please try again later.'
    };

    for (const [key, message] of Object.entries(errorMappings)) {
      if (errorMessage.includes(key)) {
        return message;
      }
    }

    // Return sanitized original message if no mapping found
    return this.sanitizeErrorMessage(error.message);
  }

  /**
   * Handles database errors with appropriate recovery actions
   */
  async handleDatabaseError(error: Error, context: Partial<ErrorContext> = {}): Promise<void> {
    const isDatabaseError = this.isDatabaseError(error);
    
    if (isDatabaseError) {
      await this.handleError(error, {
        ...context,
        action: 'database_error',
        component: 'database_handler'
      }, { severity: 'high' });

      // Check if it's a connection issue
      if (this.isConnectionError(error)) {
        // Implement connection recovery logic
        await this.attemptDatabaseReconnection();
      }
    }
  }

  /**
   * Handles authentication errors with appropriate redirects
   */
  async handleAuthError(error: Error, context: Partial<ErrorContext> = {}): Promise<void> {
    const isAuthError = this.isAuthError(error);
    
    if (isAuthError) {
      await this.handleError(error, {
        ...context,
        action: 'authentication_error',
        component: 'auth_handler'
      }, { severity: 'medium' });

      // Clear invalid session data
      await this.clearInvalidSession();
      
      // Redirect to login if needed
      if (this.shouldRedirectToLogin(error)) {
        window.location.href = '/login';
      }
    }
  }

  /**
   * Gets error statistics for monitoring
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorReport[];
    retrySuccessRate: number;
  } {
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    let totalRetries = 0;
    let successfulRetries = 0;

    this.errorQueue.forEach(errorReport => {
      errorsByCategory[errorReport.category] = (errorsByCategory[errorReport.category] || 0) + 1;
      errorsBySeverity[errorReport.severity] = (errorsBySeverity[errorReport.severity] || 0) + 1;
      
      if (errorReport.retryCount > 0) {
        totalRetries++;
        if (errorReport.resolved) {
          successfulRetries++;
        }
      }
    });

    return {
      totalErrors: this.errorQueue.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors: this.errorQueue.slice(-10),
      retrySuccessRate: totalRetries > 0 ? (successfulRetries / totalRetries) * 100 : 0
    };
  }

  /**
   * Clears resolved errors from queue
   */
  clearResolvedErrors(): void {
    this.errorQueue = this.errorQueue.filter(error => !error.resolved);
  }

  // Private helper methods
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        action: 'unhandled_promise_rejection',
        component: 'global_handler'
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        action: 'javascript_error',
        component: 'global_handler',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  private async logError(errorReport: ErrorReport): Promise<void> {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Report:', errorReport);
    }

    // Log security event for high/critical errors
    if (errorReport.severity === 'high' || errorReport.severity === 'critical') {
      await this.securityService.logSecurityEvent({
        user_id: errorReport.context.userId || 'anonymous',
        event_type: 'suspicious_activity',
        description: `${errorReport.severity} error: ${errorReport.error.message}`,
        severity: errorReport.severity,
        metadata: {
          category: errorReport.category,
          component: errorReport.context.component,
          action: errorReport.context.action
        }
      });
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      await this.sendToMonitoringService(errorReport);
    }
  }

  private addToQueue(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport);
    
    // Maintain queue size
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue.shift();
    }
  }

  private async processError(errorReport: ErrorReport): Promise<void> {
    switch (errorReport.category) {
      case 'network':
        await this.processNetworkError(errorReport);
        break;
      case 'database':
        await this.processDatabaseError(errorReport);
        break;
      case 'authentication':
        await this.processAuthError(errorReport);
        break;
      case 'validation':
        await this.processValidationError(errorReport);
        break;
      default:
        await this.processGenericError(errorReport);
    }
  }

  private determineSeverity(error: Error): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical';
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden') || 
        message.includes('network') || message.includes('connection')) {
      return 'high';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'medium';
    }
    
    return 'low';
  }

  private categorizeError(error: Error): ErrorReport['category'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('connection') || message.includes('timeout')) {
      return 'network';
    }
    
    if (message.includes('unauthorized') || message.includes('forbidden') || 
        message.includes('authentication') || message.includes('token')) {
      return 'authentication';
    }
    
    if (message.includes('database') || message.includes('sql') || 
        message.includes('supabase') || stack.includes('supabase')) {
      return 'database';
    }
    
    if (message.includes('validation') || message.includes('invalid') || 
        message.includes('required') || message.includes('format')) {
      return 'validation';
    }
    
    if (stack.includes('react') || stack.includes('component')) {
      return 'ui';
    }
    
    return 'unknown';
  }

  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('network') || message.includes('fetch') || 
           message.includes('connection') || message.includes('timeout') ||
           error.name === 'NetworkError' || error.name === 'TypeError';
  }

  private isDatabaseError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('database') || message.includes('sql') || 
           message.includes('supabase') || message.includes('postgres');
  }

  private isConnectionError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('connection') || message.includes('connect') ||
           message.includes('timeout') || message.includes('unreachable');
  }

  private isAuthError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('unauthorized') || message.includes('forbidden') ||
           message.includes('authentication') || message.includes('token') ||
           error.name === 'AuthError';
  }

  private shouldRedirectToLogin(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('unauthorized') || message.includes('invalid token') ||
           message.includes('session expired');
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    return message
      .replace(/password/gi, '[REDACTED]')
      .replace(/token/gi, '[REDACTED]')
      .replace(/key/gi, '[REDACTED]')
      .replace(/secret/gi, '[REDACTED]');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async logRecovery(context: Partial<ErrorContext>, attempts: number): Promise<void> {
    console.log(`✅ Operation recovered after ${attempts} attempts`);
    
    if (context.userId) {
      await this.securityService.logSecurityEvent({
        user_id: context.userId,
        event_type: 'data_access',
        description: `Operation recovered after ${attempts} retry attempts`,
        severity: 'low',
        metadata: { attempts, component: context.component, action: context.action }
      });
    }
  }

  private async processNetworkError(errorReport: ErrorReport): Promise<void> {
    // Implement network-specific error handling
    console.log('Processing network error:', errorReport.error.message);
  }

  private async processDatabaseError(errorReport: ErrorReport): Promise<void> {
    // Implement database-specific error handling
    console.log('Processing database error:', errorReport.error.message);
  }

  private async processAuthError(errorReport: ErrorReport): Promise<void> {
    // Implement auth-specific error handling
    console.log('Processing auth error:', errorReport.error.message);
  }

  private async processValidationError(errorReport: ErrorReport): Promise<void> {
    // Implement validation-specific error handling
    console.log('Processing validation error:', errorReport.error.message);
  }

  private async processGenericError(errorReport: ErrorReport): Promise<void> {
    // Implement generic error handling
    console.log('Processing generic error:', errorReport.error.message);
  }

  private async attemptDatabaseReconnection(): Promise<void> {
    // Implement database reconnection logic
    console.log('Attempting database reconnection...');
  }

  private async clearInvalidSession(): Promise<void> {
    // Clear invalid session data
    sessionStorage.clear();
    localStorage.removeItem('supabase.auth.token');
  }

  private async sendToMonitoringService(errorReport: ErrorReport): Promise<void> {
    // In production, send to external monitoring service
    console.log('Would send to monitoring service:', errorReport);
  }
}