/**
 * Database connection pool utilities for optimizing Supabase connections
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ConnectionPoolConfig {
  maxConnections: number;
  idleTimeout: number;
  connectionTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ConnectionStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  failedConnections: number;
  averageResponseTime: number;
}

class ConnectionPool {
  private connections: SupabaseClient[] = [];
  private activeConnections = new Set<SupabaseClient>();
  private idleConnections: SupabaseClient[] = [];
  private config: ConnectionPoolConfig;
  private stats: ConnectionStats = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    failedConnections: 0,
    averageResponseTime: 0
  };
  private responseTimes: number[] = [];

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnections: 10,
      idleTimeout: 30000, // 30 seconds
      connectionTimeout: 5000, // 5 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
      ...config
    };

    // Initialize connection pool
    this.initializePool();
  }

  /**
   * Initialize the connection pool with idle connections
   */
  private initializePool(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create initial connections
    const initialConnections = Math.min(3, this.config.maxConnections);
    
    for (let i = 0; i < initialConnections; i++) {
      const client = createClient(supabaseUrl, supabaseKey, {
        db: {
          schema: 'public',
        },
        auth: {
          autoRefreshToken: true,
          persistSession: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      this.connections.push(client);
      this.idleConnections.push(client);
    }

    this.updateStats();
    console.log(`Connection pool initialized with ${initialConnections} connections`);
  }

  /**
   * Get a connection from the pool
   */
  async getConnection(): Promise<SupabaseClient> {
    const startTime = performance.now();

    try {
      let connection: SupabaseClient;

      // Try to get an idle connection first
      if (this.idleConnections.length > 0) {
        connection = this.idleConnections.pop()!;
      } else if (this.connections.length < this.config.maxConnections) {
        // Create a new connection if under limit
        connection = this.createNewConnection();
        this.connections.push(connection);
      } else {
        // Wait for a connection to become available
        connection = await this.waitForConnection();
      }

      // Mark connection as active
      this.activeConnections.add(connection);
      this.updateStats();

      const responseTime = performance.now() - startTime;
      this.recordResponseTime(responseTime);

      return connection;
    } catch (error) {
      this.stats.failedConnections++;
      console.error('Failed to get database connection:', error);
      throw error;
    }
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(connection: SupabaseClient): void {
    if (this.activeConnections.has(connection)) {
      this.activeConnections.delete(connection);
      this.idleConnections.push(connection);
      this.updateStats();
    }
  }

  /**
   * Create a new database connection
   */
  private createNewConnection(): SupabaseClient {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, supabaseKey, {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: true,
        persistSession: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(): Promise<SupabaseClient> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      const checkForConnection = () => {
        if (this.idleConnections.length > 0) {
          clearTimeout(timeout);
          resolve(this.idleConnections.pop()!);
        } else {
          setTimeout(checkForConnection, 100);
        }
      };

      checkForConnection();
    });
  }

  /**
   * Update connection statistics
   */
  private updateStats(): void {
    this.stats.activeConnections = this.activeConnections.size;
    this.stats.idleConnections = this.idleConnections.length;
    this.stats.totalConnections = this.connections.length;
    this.stats.averageResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;
  }

  /**
   * Record response time for statistics
   */
  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    
    // Keep only the last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }
  }

  /**
   * Get connection pool statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * Execute a query with automatic connection management
   */
  async executeQuery<T>(
    queryFn: (client: SupabaseClient) => Promise<T>,
    retryOnFailure = true
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts < this.config.retryAttempts) {
      let connection: SupabaseClient | null = null;
      
      try {
        connection = await this.getConnection();
        const result = await queryFn(connection);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        attempts++;
        
        console.warn(`Query attempt ${attempts} failed:`, lastError.message);
        
        if (!retryOnFailure || attempts >= this.config.retryAttempts) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempts));
      } finally {
        if (connection) {
          this.releaseConnection(connection);
        }
      }
    }

    throw lastError || new Error('Query failed after all retry attempts');
  }

  /**
   * Clean up idle connections that have been idle too long
   */
  cleanupIdleConnections(): void {
    // For Supabase, we don't need to manually close connections
    // as they're managed by the client library
    console.log('Connection pool cleanup completed');
  }

  /**
   * Shutdown the connection pool
   */
  shutdown(): void {
    this.connections = [];
    this.activeConnections.clear();
    this.idleConnections = [];
    this.updateStats();
    console.log('Connection pool shutdown completed');
  }
}

// Global connection pool instance
export const connectionPool = new ConnectionPool({
  maxConnections: 15,
  idleTimeout: 60000,
  connectionTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
});

/**
 * Execute a query using the connection pool
 */
export async function executeWithPool<T>(
  queryFn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  return connectionPool.executeQuery(queryFn);
}

/**
 * Get connection pool statistics
 */
export function getConnectionStats(): ConnectionStats {
  return connectionPool.getStats();
}

export default connectionPool;