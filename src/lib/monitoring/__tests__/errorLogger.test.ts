/**
 * Tests for the error logging system
 */

import { errorLogger, ErrorCategory, ErrorSeverity } from '../errorLogger';

describe('ErrorLogger', () => {
  beforeEach(() => {
    errorLogger.clearErrors();
  });

  describe('logError', () => {
    it('should log an error with all required fields', () => {
      const errorId = errorLogger.logError(
        ErrorCategory.API_ERROR,
        ErrorSeverity.HIGH,
        'Test error message',
        new Error('Test error'),
        { testContext: 'value' },
        true
      );

      expect(errorId).toBeDefined();
      expect(typeof errorId).toBe('string');

      const metrics = errorLogger.getMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByCategory[ErrorCategory.API_ERROR]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
    });

    it('should handle errors without Error objects', () => {
      const errorId = errorLogger.logError(
        ErrorCategory.VALIDATION_ERROR,
        ErrorSeverity.MEDIUM,
        'Validation failed'
      );

      expect(errorId).toBeDefined();
      const metrics = errorLogger.getMetrics();
      expect(metrics.totalErrors).toBe(1);
    });

    it('should sanitize sensitive data in context', () => {
      errorLogger.logError(
        ErrorCategory.API_ERROR,
        ErrorSeverity.LOW,
        'Test error',
        undefined,
        { password: 'secret123', token: 'abc123', normalField: 'value' }
      );

      const recentErrors = errorLogger.getMetrics().recentErrors;
      const error = recentErrors[0];
      
      expect(error.context?.password).toBe('[REDACTED]');
      expect(error.context?.token).toBe('[REDACTED]');
      expect(error.context?.normalField).toBe('value');
    });
  });

  describe('logApiError', () => {
    it('should log API errors with proper categorization', () => {
      const errorId = errorLogger.logApiError(
        '/api/test',
        'GET',
        500,
        new Error('Server error'),
        { param: 'value' },
        { error: 'Internal server error' },
        1500
      );

      expect(errorId).toBeDefined();
      
      const metrics = errorLogger.getMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByCategory[ErrorCategory.SYSTEM_ERROR]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
    });

    it('should categorize 401 errors as authentication errors', () => {
      errorLogger.logApiError(
        '/api/secure',
        'POST',
        401,
        new Error('Unauthorized')
      );

      const metrics = errorLogger.getMetrics();
      expect(metrics.errorsByCategory[ErrorCategory.AUTHENTICATION_ERROR]).toBe(1);
    });
  });

  describe('logDatabaseError', () => {
    it('should log database errors with operation context', () => {
      const errorId = errorLogger.logDatabaseError(
        'SELECT',
        'users',
        'SELECT * FROM users WHERE id = ?',
        new Error('Connection timeout'),
        2500
      );

      expect(errorId).toBeDefined();
      
      const metrics = errorLogger.getMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByCategory[ErrorCategory.DATABASE_ERROR]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
    });

    it('should sanitize SQL queries', () => {
      errorLogger.logDatabaseError(
        'INSERT',
        'users',
        "INSERT INTO users (name, password) VALUES ('John', 'secret123')",
        new Error('Insert failed')
      );

      const recentErrors = errorLogger.getMetrics().recentErrors;
      const error = recentErrors[0];
      
      expect(error.context?.query).toContain('[REDACTED]');
      expect(error.context?.query).not.toContain('secret123');
    });
  });

  describe('logRealtimeError', () => {
    it('should log real-time connection errors', () => {
      const errorId = errorLogger.logRealtimeError(
        'conn_123',
        'connection_failed',
        new Error('WebSocket error'),
        2,
        5
      );

      expect(errorId).toBeDefined();
      
      const metrics = errorLogger.getMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByCategory[ErrorCategory.REALTIME_ERROR]).toBe(1);
    });

    it('should escalate severity for max reconnect attempts', () => {
      errorLogger.logRealtimeError(
        'conn_123',
        'connection_failed',
        new Error('Max retries exceeded'),
        5,
        5
      );

      const metrics = errorLogger.getMetrics();
      expect(metrics.errorsBySeverity[ErrorSeverity.CRITICAL]).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('should return correct metrics for multiple errors', () => {
      // Log various types of errors
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'API Error 1');
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.MEDIUM, 'API Error 2');
      errorLogger.logError(ErrorCategory.DATABASE_ERROR, ErrorSeverity.HIGH, 'DB Error 1');
      errorLogger.logError(ErrorCategory.REALTIME_ERROR, ErrorSeverity.LOW, 'RT Error 1');

      const metrics = errorLogger.getMetrics();
      
      expect(metrics.totalErrors).toBe(4);
      expect(metrics.errorsByCategory[ErrorCategory.API_ERROR]).toBe(2);
      expect(metrics.errorsByCategory[ErrorCategory.DATABASE_ERROR]).toBe(1);
      expect(metrics.errorsByCategory[ErrorCategory.REALTIME_ERROR]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(2);
      expect(metrics.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.LOW]).toBe(1);
    });

    it('should calculate error rate correctly', () => {
      // Log errors over time
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Error 1');
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Error 2');
      
      const metrics = errorLogger.getMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0);
    });

    it('should return top errors by frequency', () => {
      // Log same error multiple times
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Frequent error');
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Frequent error');
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Frequent error');
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Rare error');

      const metrics = errorLogger.getMetrics();
      expect(metrics.topErrors).toHaveLength(2);
      expect(metrics.topErrors[0].message).toBe('Frequent error');
      expect(metrics.topErrors[0].count).toBe(3);
      expect(metrics.topErrors[1].message).toBe('Rare error');
      expect(metrics.topErrors[1].count).toBe(1);
    });
  });

  describe('resolveError', () => {
    it('should mark errors as resolved', () => {
      const errorId = errorLogger.logError(
        ErrorCategory.API_ERROR,
        ErrorSeverity.HIGH,
        'Test error'
      );

      const resolved = errorLogger.resolveError(errorId);
      expect(resolved).toBe(true);

      const unresolved = errorLogger.getUnresolvedErrors();
      expect(unresolved).toHaveLength(0);
    });

    it('should return false for non-existent error IDs', () => {
      const resolved = errorLogger.resolveError('non-existent-id');
      expect(resolved).toBe(false);
    });
  });

  describe('exportErrors', () => {
    it('should export errors in JSON format', () => {
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Test error');
      
      const exported = errorLogger.exportErrors('json');
      const parsed = JSON.parse(exported);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].message).toBe('Test error');
    });

    it('should export errors in CSV format', () => {
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Test error');
      
      const exported = errorLogger.exportErrors('csv');
      const lines = exported.split('\n');
      
      expect(lines).toHaveLength(2); // Header + 1 error
      expect(lines[0]).toContain('id,timestamp,category,severity,message');
      expect(lines[1]).toContain('Test error');
    });
  });

  describe('subscription', () => {
    it('should notify subscribers of new errors', () => {
      const mockCallback = jest.fn();
      const unsubscribe = errorLogger.subscribe(mockCallback);

      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Test error');

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          category: ErrorCategory.API_ERROR,
          severity: ErrorSeverity.HIGH
        })
      );

      unsubscribe();
      
      errorLogger.logError(ErrorCategory.API_ERROR, ErrorSeverity.HIGH, 'Another error');
      expect(mockCallback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});