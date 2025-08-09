/**
 * Structured error logging system for API failures and application errors
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  API_ERROR = 'api_error',
  DATABASE_ERROR = 'database_error',
  NETWORK_ERROR = 'network_error',
  REALTIME_ERROR = 'realtime_error',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  PERFORMANCE_ERROR = 'performance_error',
  USER_ERROR = 'user_error',
  SYSTEM_ERROR = 'system_error'
}

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  error?: Error;
  context?: Record<string, any>;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  retryable: boolean;
  retryCount?: number;
  resolved?: boolean;
  resolvedAt?: Date;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorRate: number; // errors per minute
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurrence: Date;
  }>;
  recentErrors: ErrorLogEntry[];
}

class ErrorLogger {
  private errors: ErrorLogEntry[] = [];
  private maxErrors = 1000; // Keep last 1000 errors
  private errorCounts = new Map<string, number>();
  private listeners: Array<(error: ErrorLogEntry) => void> = [];

  /**
   * Log an error with structured information
   */
  logError(
    category: ErrorCategory,
    severity: ErrorSeverity,
    message: string,
    error?: Error,
    context?: Record<string, any>,
    retryable: boolean = true
  ): string {
    const errorId = this.generateErrorId();
    
    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: new Date(),
      category,
      severity,
      message,
      error,
      context: this.sanitizeData({
        ...context,
        // Add browser/environment context
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: new Date().toISOString(),
      }),
      stackTrace: error?.stack,
      retryable,
      retryCount: 0,
      resolved: false
    };

    this.addError(logEntry);
    this.notifyListeners(logEntry);
    this.logToConsole(logEntry);

    // Track error frequency
    this.updateErrorCount(message);

    return errorId;
  }

  /**
   * Log API-specific errors with additional context
   */
  logApiError(
    endpoint: string,
    method: string,
    statusCode?: number,
    error?: Error,
    requestData?: any,
    responseData?: any,
    duration?: number
  ): string {
    const severity = this.determineSeverityFromStatusCode(statusCode);
    const category = this.determineCategoryFromStatusCode(statusCode);
    
    return this.logError(
      category,
      severity,
      `API ${method} ${endpoint} failed${statusCode ? ` with status ${statusCode}` : ''}`,
      error,
      {
        endpoint,
        method,
        statusCode,
        requestData: this.sanitizeData(requestData),
        responseData: this.sanitizeData(responseData),
        duration,
        apiCall: true
      },
      statusCode ? statusCode >= 500 : true // Server errors are retryable
    );
  }

  /**
   * Log database-specific errors
   */
  logDatabaseError(
    operation: string,
    table?: string,
    query?: string,
    error?: Error,
    duration?: number
  ): string {
    return this.logError(
      ErrorCategory.DATABASE_ERROR,
      ErrorSeverity.HIGH,
      `Database ${operation} failed${table ? ` on table ${table}` : ''}`,
      error,
      {
        operation,
        table,
        query: this.sanitizeQuery(query),
        duration,
        databaseOperation: true
      },
      true
    );
  }

  /**
   * Log real-time connection errors
   */
  logRealtimeError(
    connectionId: string,
    event: string,
    error?: Error,
    reconnectAttempt?: number,
    maxReconnectAttempts?: number
  ): string {
    const severity = reconnectAttempt && maxReconnectAttempts && reconnectAttempt >= maxReconnectAttempts
      ? ErrorSeverity.CRITICAL
      : ErrorSeverity.MEDIUM;

    return this.logError(
      ErrorCategory.REALTIME_ERROR,
      severity,
      `Real-time connection error: ${event}`,
      error,
      {
        connectionId,
        event,
        reconnectAttempt,
        maxReconnectAttempts,
        realtimeConnection: true
      },
      true
    );
  }

  /**
   * Log performance-related errors
   */
  logPerformanceError(
    operation: string,
    duration: number,
    threshold: number,
    context?: Record<string, any>
  ): string {
    const severity = duration > threshold * 2 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    
    return this.logError(
      ErrorCategory.PERFORMANCE_ERROR,
      severity,
      `Performance threshold exceeded: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
      undefined,
      {
        operation,
        duration,
        threshold,
        performanceIssue: true,
        ...context
      },
      false // Performance issues are not retryable
    );
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Increment retry count for an error
   */
  incrementRetryCount(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.retryCount = (error.retryCount || 0) + 1;
      return true;
    }
    return false;
  }

  /**
   * Get error metrics and statistics
   */
  getMetrics(timeRange?: { start: Date; end: Date }): ErrorMetrics {
    const relevantErrors = timeRange
      ? this.errors.filter(e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end)
      : this.errors;

    const errorsByCategory = Object.values(ErrorCategory).reduce((acc, category) => {
      acc[category] = relevantErrors.filter(e => e.category === category).length;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = relevantErrors.filter(e => e.severity === severity).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    // Calculate error rate (errors per minute)
    const timeSpanMinutes = timeRange
      ? (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60)
      : 60; // Default to last hour
    const errorRate = relevantErrors.length / Math.max(timeSpanMinutes, 1);

    // Get top errors by frequency
    const errorFrequency = new Map<string, { count: number; lastOccurrence: Date }>();
    relevantErrors.forEach(error => {
      const key = error.message;
      const existing = errorFrequency.get(key);
      if (existing) {
        existing.count++;
        if (error.timestamp > existing.lastOccurrence) {
          existing.lastOccurrence = error.timestamp;
        }
      } else {
        errorFrequency.set(key, { count: 1, lastOccurrence: error.timestamp });
      }
    });

    const topErrors = Array.from(errorFrequency.entries())
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: relevantErrors.length,
      errorsByCategory,
      errorsBySeverity,
      errorRate,
      topErrors,
      recentErrors: relevantErrors.slice(-20) // Last 20 errors
    };
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory, limit = 50): ErrorLogEntry[] {
    return this.errors
      .filter(e => e.category === category)
      .slice(-limit);
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(severity?: ErrorSeverity): ErrorLogEntry[] {
    return this.errors.filter(e => 
      !e.resolved && (severity ? e.severity === severity : true)
    );
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener: (error: ErrorLogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    this.errorCounts.clear();
  }

  /**
   * Export errors for external analysis
   */
  exportErrors(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'category', 'severity', 'message', 'retryable', 'resolved'];
      const rows = this.errors.map(error => [
        error.id,
        error.timestamp.toISOString(),
        error.category,
        error.severity,
        error.message.replace(/,/g, ';'), // Escape commas
        error.retryable,
        error.resolved
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.errors, null, 2);
  }

  // Private methods

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addError(error: ErrorLogEntry): void {
    this.errors.push(error);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  private notifyListeners(error: ErrorLogEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error logger listener:', err);
      }
    });
  }

  private logToConsole(error: ErrorLogEntry): void {
    const prefix = this.getSeverityEmoji(error.severity);
    const message = `${prefix} [${error.category}] ${error.message}`;
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(message, error.error, error.context);
        break;
      case ErrorSeverity.HIGH:
        console.error(message, error.error, error.context);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(message, error.context);
        break;
      case ErrorSeverity.LOW:
        console.log(message, error.context);
        break;
    }
  }

  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return '🚨';
      case ErrorSeverity.HIGH: return '❌';
      case ErrorSeverity.MEDIUM: return '⚠️';
      case ErrorSeverity.LOW: return 'ℹ️';
      default: return '❓';
    }
  }

  private updateErrorCount(message: string): void {
    const count = this.errorCounts.get(message) || 0;
    this.errorCounts.set(message, count + 1);
  }

  private determineSeverityFromStatusCode(statusCode?: number): ErrorSeverity {
    if (!statusCode) return ErrorSeverity.MEDIUM;
    
    if (statusCode >= 500) return ErrorSeverity.HIGH;
    if (statusCode >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  private determineCategoryFromStatusCode(statusCode?: number): ErrorCategory {
    if (!statusCode) return ErrorCategory.API_ERROR;
    
    if (statusCode === 401 || statusCode === 403) return ErrorCategory.AUTHENTICATION_ERROR;
    if (statusCode === 404) return ErrorCategory.API_ERROR;
    if (statusCode >= 500) return ErrorCategory.SYSTEM_ERROR;
    if (statusCode >= 400) return ErrorCategory.API_ERROR;
    return ErrorCategory.API_ERROR;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      Object.keys(sanitized).forEach(key => {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
          sanitized[key] = '[REDACTED]';
        }
      });
      return sanitized;
    }
    
    return data;
  }

  private sanitizeQuery(query?: string): string | undefined {
    if (!query) return query;
    
    // Remove potential sensitive data from SQL queries
    return query.replace(/('.*?'|".*?")/g, '[REDACTED]');
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Convenience functions for common error types
export const logApiError = errorLogger.logApiError.bind(errorLogger);
export const logDatabaseError = errorLogger.logDatabaseError.bind(errorLogger);
export const logRealtimeError = errorLogger.logRealtimeError.bind(errorLogger);
export const logPerformanceError = errorLogger.logPerformanceError.bind(errorLogger);

export default errorLogger;