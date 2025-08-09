/**
 * Real-time connection monitoring and error tracking system
 */

import { errorLogger, ErrorCategory, ErrorSeverity } from './errorLogger';
import { performanceMonitor, PerformanceCategory } from './performanceMonitor';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
  CLOSED = 'closed'
}

export enum ConnectionEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',
  ERROR = 'error',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_SENT = 'message_sent',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_CLOSED = 'subscription_closed'
}

export interface ConnectionMetric {
  id: string;
  connectionId: string;
  timestamp: Date;
  event: ConnectionEvent;
  state: ConnectionState;
  duration?: number;
  error?: Error;
  metadata?: Record<string, any>;
  reconnectAttempt?: number;
  latency?: number;
}

export interface ConnectionHealth {
  connectionId: string;
  state: ConnectionState;
  connectedAt?: Date;
  lastActivity: Date;
  totalConnectTime: number;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  averageLatency: number;
  messagesSent: number;
  messagesReceived: number;
  errorsCount: number;
  lastError?: {
    timestamp: Date;
    message: string;
    error?: Error;
  };
  subscriptions: Array<{
    id: string;
    table: string;
    event: string;
    createdAt: Date;
    active: boolean;
  }>;
}

export interface RealtimeStats {
  totalConnections: number;
  activeConnections: number;
  totalReconnects: number;
  averageConnectionTime: number;
  averageLatency: number;
  totalMessages: number;
  errorRate: number;
  connectionUptime: number;
  recentEvents: ConnectionMetric[];
  healthyConnections: number;
  unhealthyConnections: number;
}

class RealtimeMonitor {
  private metrics: ConnectionMetric[] = [];
  private connections = new Map<string, ConnectionHealth>();
  private maxMetrics = 1000;
  private listeners: Array<(metric: ConnectionMetric) => void> = [];
  private healthCheckInterval?: NodeJS.Timeout;
  private healthCheckIntervalMs = 30000; // 30 seconds

  constructor() {
    this.startHealthCheck();
  }

  /**
   * Track connection state changes
   */
  trackConnectionEvent(
    connectionId: string,
    event: ConnectionEvent,
    state: ConnectionState,
    metadata?: Record<string, any>,
    error?: Error,
    duration?: number
  ): void {
    const metric: ConnectionMetric = {
      id: this.generateMetricId(),
      connectionId,
      timestamp: new Date(),
      event,
      state,
      duration,
      error,
      metadata,
      latency: metadata?.latency
    };

    this.addMetric(metric);
    this.updateConnectionHealth(connectionId, event, state, error, duration, metadata);
    this.notifyListeners(metric);

    // Log significant events
    this.logConnectionEvent(metric);

    // Track performance for connection events
    if (duration !== undefined) {
      performanceMonitor.trackRealtimeConnection(
        connectionId,
        event,
        duration,
        !error,
        error?.message
      );
    }
  }

  /**
   * Track connection establishment
   */
  trackConnection(
    connectionId: string,
    duration: number,
    success: boolean,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const event = success ? ConnectionEvent.CONNECT : ConnectionEvent.ERROR;
    const state = success ? ConnectionState.CONNECTED : ConnectionState.ERROR;

    this.trackConnectionEvent(connectionId, event, state, metadata, error, duration);

    if (!success && error) {
      errorLogger.logRealtimeError(connectionId, 'connection_failed', error);
    }
  }

  /**
   * Track disconnection
   */
  trackDisconnection(
    connectionId: string,
    reason?: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    this.trackConnectionEvent(
      connectionId,
      ConnectionEvent.DISCONNECT,
      ConnectionState.DISCONNECTED,
      { reason, ...metadata },
      error
    );

    if (error) {
      errorLogger.logRealtimeError(connectionId, 'disconnection_error', error);
    }
  }

  /**
   * Track reconnection attempts
   */
  trackReconnection(
    connectionId: string,
    attempt: number,
    maxAttempts: number,
    duration: number,
    success: boolean,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    const event = success ? ConnectionEvent.RECONNECT : ConnectionEvent.ERROR;
    const state = success ? ConnectionState.CONNECTED : ConnectionState.RECONNECTING;

    this.trackConnectionEvent(
      connectionId,
      event,
      state,
      { attempt, maxAttempts, ...metadata },
      error,
      duration
    );

    // Update reconnect attempt in connection health
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.reconnectAttempts = attempt;
      connection.maxReconnectAttempts = maxAttempts;
    }

    if (!success && error) {
      errorLogger.logRealtimeError(connectionId, 'reconnection_failed', error, attempt, maxAttempts);
    }
  }

  /**
   * Track message events
   */
  trackMessage(
    connectionId: string,
    event: ConnectionEvent.MESSAGE_SENT | ConnectionEvent.MESSAGE_RECEIVED,
    latency?: number,
    messageSize?: number,
    messageType?: string
  ): void {
    this.trackConnectionEvent(
      connectionId,
      event,
      ConnectionState.CONNECTED,
      {
        messageSize,
        messageType,
        latency
      },
      undefined,
      latency
    );

    // Update message counts in connection health
    const connection = this.connections.get(connectionId);
    if (connection) {
      if (event === ConnectionEvent.MESSAGE_SENT) {
        connection.messagesSent++;
      } else {
        connection.messagesReceived++;
      }
      
      if (latency !== undefined) {
        // Update average latency
        const totalLatency = connection.averageLatency * (connection.messagesSent + connection.messagesReceived - 1);
        connection.averageLatency = (totalLatency + latency) / (connection.messagesSent + connection.messagesReceived);
      }
      
      connection.lastActivity = new Date();
    }
  }

  /**
   * Track subscription events
   */
  trackSubscription(
    connectionId: string,
    subscriptionId: string,
    table: string,
    event: string,
    action: 'created' | 'closed',
    error?: Error
  ): void {
    const connectionEvent = action === 'created' 
      ? ConnectionEvent.SUBSCRIPTION_CREATED 
      : ConnectionEvent.SUBSCRIPTION_CLOSED;

    this.trackConnectionEvent(
      connectionId,
      connectionEvent,
      ConnectionState.CONNECTED,
      {
        subscriptionId,
        table,
        event,
        action
      },
      error
    );

    // Update subscriptions in connection health
    const connection = this.connections.get(connectionId);
    if (connection) {
      if (action === 'created') {
        connection.subscriptions.push({
          id: subscriptionId,
          table,
          event,
          createdAt: new Date(),
          active: true
        });
      } else {
        const subscription = connection.subscriptions.find(s => s.id === subscriptionId);
        if (subscription) {
          subscription.active = false;
        }
      }
    }

    if (error) {
      errorLogger.logRealtimeError(connectionId, `subscription_${action}_error`, error);
    }
  }

  /**
   * Get connection health for a specific connection
   */
  getConnectionHealth(connectionId: string): ConnectionHealth | null {
    return this.connections.get(connectionId) || null;
  }

  /**
   * Get overall real-time statistics
   */
  getRealtimeStats(timeRange?: { start: Date; end: Date }): RealtimeStats {
    const relevantMetrics = timeRange
      ? this.metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
      : this.metrics;

    const connections = Array.from(this.connections.values());
    const activeConnections = connections.filter(c => c.state === ConnectionState.CONNECTED);
    const totalReconnects = relevantMetrics.filter(m => m.event === ConnectionEvent.RECONNECT).length;
    const totalMessages = relevantMetrics.filter(m => 
      m.event === ConnectionEvent.MESSAGE_SENT || m.event === ConnectionEvent.MESSAGE_RECEIVED
    ).length;
    const errorMetrics = relevantMetrics.filter(m => m.error);
    const connectionMetrics = relevantMetrics.filter(m => m.event === ConnectionEvent.CONNECT);

    // Calculate averages
    const connectionDurations = connectionMetrics
      .filter(m => m.duration !== undefined)
      .map(m => m.duration!);
    const averageConnectionTime = connectionDurations.length > 0
      ? connectionDurations.reduce((sum, d) => sum + d, 0) / connectionDurations.length
      : 0;

    const latencies = relevantMetrics
      .filter(m => m.latency !== undefined)
      .map(m => m.latency!);
    const averageLatency = latencies.length > 0
      ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length
      : 0;

    // Calculate uptime
    const now = new Date();
    const totalUptime = connections.reduce((sum, conn) => {
      if (conn.connectedAt && conn.state === ConnectionState.CONNECTED) {
        return sum + (now.getTime() - conn.connectedAt.getTime());
      }
      return sum + conn.totalConnectTime;
    }, 0);
    const connectionUptime = connections.length > 0 ? totalUptime / connections.length : 0;

    // Health assessment
    const healthyConnections = connections.filter(c => 
      c.state === ConnectionState.CONNECTED && 
      c.errorsCount < 5 && 
      (now.getTime() - c.lastActivity.getTime()) < 300000 // Active within 5 minutes
    ).length;

    return {
      totalConnections: connections.length,
      activeConnections: activeConnections.length,
      totalReconnects,
      averageConnectionTime,
      averageLatency,
      totalMessages,
      errorRate: relevantMetrics.length > 0 ? (errorMetrics.length / relevantMetrics.length) * 100 : 0,
      connectionUptime,
      recentEvents: relevantMetrics.slice(-20),
      healthyConnections,
      unhealthyConnections: connections.length - healthyConnections
    };
  }

  /**
   * Get connection issues report
   */
  getConnectionIssuesReport(): Array<{
    connectionId: string;
    issueType: string;
    severity: ErrorSeverity;
    description: string;
    occurrences: number;
    lastOccurrence: Date;
    suggestions: string[];
  }> {
    const issues: Array<{
      connectionId: string;
      issueType: string;
      severity: ErrorSeverity;
      description: string;
      occurrences: number;
      lastOccurrence: Date;
      suggestions: string[];
    }> = [];

    this.connections.forEach((health, connectionId) => {
      const now = new Date();
      
      // Check for frequent reconnections
      if (health.reconnectAttempts > 3) {
        issues.push({
          connectionId,
          issueType: 'frequent_reconnections',
          severity: ErrorSeverity.HIGH,
          description: `Connection has attempted ${health.reconnectAttempts} reconnections`,
          occurrences: health.reconnectAttempts,
          lastOccurrence: health.lastActivity,
          suggestions: [
            'Check network stability',
            'Verify server availability',
            'Consider increasing reconnection delay'
          ]
        });
      }

      // Check for high error rate
      if (health.errorsCount > 10) {
        issues.push({
          connectionId,
          issueType: 'high_error_rate',
          severity: ErrorSeverity.HIGH,
          description: `Connection has ${health.errorsCount} errors`,
          occurrences: health.errorsCount,
          lastOccurrence: health.lastError?.timestamp || health.lastActivity,
          suggestions: [
            'Review error logs for patterns',
            'Check authentication credentials',
            'Verify subscription permissions'
          ]
        });
      }

      // Check for stale connections
      const timeSinceActivity = now.getTime() - health.lastActivity.getTime();
      if (timeSinceActivity > 600000 && health.state === ConnectionState.CONNECTED) { // 10 minutes
        issues.push({
          connectionId,
          issueType: 'stale_connection',
          severity: ErrorSeverity.MEDIUM,
          description: `No activity for ${Math.round(timeSinceActivity / 60000)} minutes`,
          occurrences: 1,
          lastOccurrence: health.lastActivity,
          suggestions: [
            'Implement heartbeat mechanism',
            'Check if connection is still needed',
            'Consider connection timeout'
          ]
        });
      }

      // Check for high latency
      if (health.averageLatency > 5000) { // 5 seconds
        issues.push({
          connectionId,
          issueType: 'high_latency',
          severity: ErrorSeverity.MEDIUM,
          description: `Average latency is ${Math.round(health.averageLatency)}ms`,
          occurrences: health.messagesReceived + health.messagesSent,
          lastOccurrence: health.lastActivity,
          suggestions: [
            'Check network conditions',
            'Consider server location',
            'Optimize message size'
          ]
        });
      }
    });

    return issues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Subscribe to real-time monitoring events
   */
  subscribe(listener: (metric: ConnectionMetric) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all metrics and connections
   */
  clearMetrics(): void {
    this.metrics = [];
    this.connections.clear();
  }

  /**
   * Stop monitoring and cleanup
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.clearMetrics();
    this.listeners = [];
  }

  // Private methods

  private generateMetricId(): string {
    return `rt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addMetric(metric: ConnectionMetric): void {
    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private updateConnectionHealth(
    connectionId: string,
    event: ConnectionEvent,
    state: ConnectionState,
    error?: Error,
    duration?: number,
    metadata?: Record<string, any>
  ): void {
    let connection = this.connections.get(connectionId);
    
    if (!connection) {
      connection = {
        connectionId,
        state: ConnectionState.DISCONNECTED,
        lastActivity: new Date(),
        totalConnectTime: 0,
        reconnectAttempts: 0,
        maxReconnectAttempts: 0,
        averageLatency: 0,
        messagesSent: 0,
        messagesReceived: 0,
        errorsCount: 0,
        subscriptions: []
      };
      this.connections.set(connectionId, connection);
    }

    // Update state
    const previousState = connection.state;
    connection.state = state;
    connection.lastActivity = new Date();

    // Handle specific events
    switch (event) {
      case ConnectionEvent.CONNECT:
        if (state === ConnectionState.CONNECTED) {
          connection.connectedAt = new Date();
          connection.reconnectAttempts = 0;
        }
        break;

      case ConnectionEvent.DISCONNECT:
        if (connection.connectedAt) {
          connection.totalConnectTime += new Date().getTime() - connection.connectedAt.getTime();
          connection.connectedAt = undefined;
        }
        break;

      case ConnectionEvent.ERROR:
        connection.errorsCount++;
        if (error) {
          connection.lastError = {
            timestamp: new Date(),
            message: error.message,
            error
          };
        }
        break;

      case ConnectionEvent.RECONNECT:
        if (state === ConnectionState.CONNECTED) {
          connection.connectedAt = new Date();
        }
        break;
    }

    // Update reconnect attempts from metadata
    if (metadata?.attempt !== undefined) {
      connection.reconnectAttempts = metadata.attempt;
    }
    if (metadata?.maxAttempts !== undefined) {
      connection.maxReconnectAttempts = metadata.maxAttempts;
    }
  }

  private notifyListeners(metric: ConnectionMetric): void {
    this.listeners.forEach(listener => {
      try {
        listener(metric);
      } catch (err) {
        console.error('Error in realtime monitor listener:', err);
      }
    });
  }

  private logConnectionEvent(metric: ConnectionMetric): void {
    const emoji = this.getEventEmoji(metric.event);
    const message = `${emoji} [${metric.connectionId}] ${metric.event}: ${metric.state}`;
    
    if (metric.error) {
      console.error(message, metric.error, metric.metadata);
    } else if (metric.event === ConnectionEvent.ERROR || metric.state === ConnectionState.ERROR) {
      console.warn(message, metric.metadata);
    } else {
      console.log(message, metric.metadata);
    }
  }

  private getEventEmoji(event: ConnectionEvent): string {
    switch (event) {
      case ConnectionEvent.CONNECT: return '🔗';
      case ConnectionEvent.DISCONNECT: return '🔌';
      case ConnectionEvent.RECONNECT: return '🔄';
      case ConnectionEvent.ERROR: return '❌';
      case ConnectionEvent.MESSAGE_RECEIVED: return '📥';
      case ConnectionEvent.MESSAGE_SENT: return '📤';
      case ConnectionEvent.SUBSCRIPTION_CREATED: return '📡';
      case ConnectionEvent.SUBSCRIPTION_CLOSED: return '📴';
      default: return '⚡';
    }
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckIntervalMs);
  }

  private performHealthCheck(): void {
    const now = new Date();
    const staleThreshold = 300000; // 5 minutes

    this.connections.forEach((health, connectionId) => {
      const timeSinceActivity = now.getTime() - health.lastActivity.getTime();
      
      // Check for stale connections
      if (timeSinceActivity > staleThreshold && health.state === ConnectionState.CONNECTED) {
        errorLogger.logError(
          ErrorCategory.REALTIME_ERROR,
          ErrorSeverity.MEDIUM,
          `Stale real-time connection detected: ${connectionId}`,
          undefined,
          {
            connectionId,
            timeSinceActivity,
            lastActivity: health.lastActivity.toISOString()
          },
          false
        );
      }

      // Check for excessive errors
      if (health.errorsCount > 20) {
        errorLogger.logError(
          ErrorCategory.REALTIME_ERROR,
          ErrorSeverity.HIGH,
          `Real-time connection has excessive errors: ${connectionId}`,
          undefined,
          {
            connectionId,
            errorsCount: health.errorsCount,
            lastError: health.lastError
          },
          false
        );
      }
    });
  }
}

// Global realtime monitor instance
export const realtimeMonitor = new RealtimeMonitor();

export default realtimeMonitor;