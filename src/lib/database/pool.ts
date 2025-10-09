import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logging';
import { CircuitBreaker } from '@/lib/resilience/circuitBreaker';
import { RetryPolicy } from '@/lib/resilience/retry';
import { DatabaseError, ConnectionError } from '@/lib/errors';

export interface DatabasePoolConfig {
  maxConnections: number;
  minConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  acquireTimeout: number;
  retryAttempts: number;
  healthCheckInterval: number;
}

export interface PooledConnection {
  client: ReturnType<typeof createClient<Database>>;
  id: string;
  createdAt: Date;
  lastUsed: Date;
  isHealthy: boolean;
  isActive: boolean;
}

export class DatabasePool {
  private connections: Map<string, PooledConnection> = new Map();
  private availableConnections: string[] = [];
  private activeConnections: Set<string> = new Set();
  private config: DatabasePoolConfig;
  private circuitBreaker: CircuitBreaker;
  private healthCheckTimer?: number;
  private cleanupTimer?: number;

  constructor(config: Partial<DatabasePoolConfig> = {}) {
    this.config = {
      maxConnections: config.maxConnections || 20,
      minConnections: config.minConnections || 5,
      connectionTimeout: config.connectionTimeout || 30000,
      idleTimeout: config.idleTimeout || 600000,
      acquireTimeout: config.acquireTimeout || 10000,
      retryAttempts: config.retryAttempts || 3,
      healthCheckInterval: config.healthCheckInterval || 30000
    };

    this.circuitBreaker = new CircuitBreaker('database-pool', {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
    });

    this.initializePool();
    this.startHealthChecks();
    this.startCleanup();
  }

  private async initializePool(): Promise<void> {
    logger.info('Initializing database connection pool', {
      maxConnections: this.config.maxConnections,
      minConnections: this.config.minConnections
    });

    try {
      // Create minimum connections
      for (let i = 0; i < this.config.minConnections; i++) {
        await this.createConnection();
      }

      logger.info('Database pool initialized successfully', {
        totalConnections: this.connections.size,
        availableConnections: this.availableConnections.length
      });
    } catch (error) {
      logger.error('Failed to initialize database pool', { error });
      throw new DatabaseError('Database pool initialization failed');
    }
  }

  private async createConnection(): Promise<string> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured');
      }

      const client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          headers: {
            'x-connection-id': connectionId,
            'x-pool-id': 'main'
          }
        },
        db: {
          schema: 'public'
        }
      });

      // Test connection
      const { error } = await client.from('user_profiles').select('id').limit(1);
      if (error) {
        throw new DatabaseError('Connection test failed');
      }

      const connection: PooledConnection = {
        client,
        id: connectionId,
        createdAt: new Date(),
        lastUsed: new Date(),
        isHealthy: true,
        isActive: false
      };

      this.connections.set(connectionId, connection);
      this.availableConnections.push(connectionId);

      logger.debug('Database connection created', { connectionId });
      return connectionId;
    } catch (error) {
      logger.error('Failed to create database connection', { connectionId, error });
      throw new ConnectionError('Connection creation failed');
    }
  }

  async acquireConnection(timeout = this.config.acquireTimeout): Promise<ReturnType<typeof createClient<Database>>> {
    const startTime = Date.now();

    return this.circuitBreaker.execute(async () => {
      while (Date.now() - startTime < timeout) {
        if (this.availableConnections.length > 0) {
          const connectionId = this.availableConnections.shift()!;
          const connection = this.connections.get(connectionId);

          if (connection && connection.isHealthy) {
            connection.isActive = true;
            connection.lastUsed = new Date();
            this.activeConnections.add(connectionId);
            
            logger.debug('Connection acquired', { connectionId });
            return connection.client;
          }
        }

        // Create new connection if under limit
        if (this.connections.size < this.config.maxConnections) {
          const connectionId = await this.createConnection();
          const connection = this.connections.get(connectionId)!;
          
          connection.isActive = true;
          connection.lastUsed = new Date();
          this.activeConnections.add(connectionId);
          this.availableConnections = this.availableConnections.filter(id => id !== connectionId);
          
          logger.debug('New connection created and acquired', { connectionId });
          return connection.client;
        }

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      throw new ConnectionError('Connection acquisition timeout');
    });
  }

  releaseConnection(client: SupabaseClient<Database>): void {
    const connectionId = this.findConnectionByClient(client);
    
    if (!connectionId) {
      logger.warn('Attempted to release unknown connection');
      return;
    }

    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isActive = false;
      connection.lastUsed = new Date();
      this.activeConnections.delete(connectionId);
      
      if (connection.isHealthy) {
        this.availableConnections.push(connectionId);
      }
    }

    logger.debug('Connection released', { connectionId });
  }

  private findConnectionByClient(client: SupabaseClient<Database>): string | undefined {
    for (const [id, connection] of this.connections) {
      if (connection.client === client) {
        return id;
      }
    }
    return undefined;
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const unhealthyConnections: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      try {
        const { error } = await connection.client
          .from('user_profiles')
          .select('id')
          .limit(1);

        if (error) {
          connection.isHealthy = false;
          unhealthyConnections.push(connectionId);
          logger.warn('Connection health check failed', { connectionId, error });
        } else {
          connection.isHealthy = true;
        }
      } catch (error) {
        connection.isHealthy = false;
        unhealthyConnections.push(connectionId);
        logger.error('Connection health check error', { connectionId, error });
      }
    }

    // Remove unhealthy connections from available pool
    this.availableConnections = this.availableConnections.filter(
      id => !unhealthyConnections.includes(id)
    );

    // Recreate unhealthy connections
    for (const connectionId of unhealthyConnections) {
      this.connections.delete(connectionId);
      this.activeConnections.delete(connectionId);
      
      try {
        await this.createConnection();
      } catch (error) {
        logger.error('Failed to recreate connection', { connectionId, error });
      }
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(async () => {
      await this.cleanupIdleConnections();
    }, 60000); // Run every minute
  }

  private async cleanupIdleConnections(): Promise<void> {
    const now = new Date();
    const connectionsToRemove: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      if (!connection.isActive && 
          now.getTime() - connection.lastUsed.getTime() > this.config.idleTimeout) {
        connectionsToRemove.push(connectionId);
      }
    }

    // Keep minimum connections
    const remainingConnections = this.connections.size - connectionsToRemove.length;
    if (remainingConnections < this.config.minConnections) {
      const excessToKeep = this.config.minConnections - remainingConnections;
      connectionsToRemove.splice(0, excessToKeep);
    }

    for (const connectionId of connectionsToRemove) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        this.connections.delete(connectionId);
        this.availableConnections = this.availableConnections.filter(id => id !== connectionId);
        this.activeConnections.delete(connectionId);
        
        logger.debug('Idle connection removed', { connectionId });
      }
    }
  }

  getStats(): {
    totalConnections: number;
    availableConnections: number;
    activeConnections: number;
    healthyConnections: number;
  } {
    let healthyConnections = 0;
    for (const connection of this.connections.values()) {
      if (connection.isHealthy) healthyConnections++;
    }

    return {
      totalConnections: this.connections.size,
      availableConnections: this.availableConnections.length,
      activeConnections: this.activeConnections.size,
      healthyConnections
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down database connection pool');

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Wait for active connections to complete
    const maxWaitTime = 30000;
    const startTime = Date.now();
    
    while (this.activeConnections.size > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Close all connections
    for (const connection of this.connections.values()) {
      try {
        await connection.client.auth.signOut();
      } catch (error) {
        logger.warn('Error closing connection', { error });
      }
    }

    this.connections.clear();
    this.availableConnections = [];
    this.activeConnections.clear();

    logger.info('Database connection pool shutdown complete');
  }
}

// Global pool instance
let globalPool: DatabasePool | null = null;

export function createDatabasePool(config?: Partial<DatabasePoolConfig>): DatabasePool {
  if (!globalPool) {
    globalPool = new DatabasePool(config);
  }
  return globalPool;
}

export function getDatabasePool(): DatabasePool {
  if (!globalPool) {
    throw new Error('Database pool not initialized. Call createDatabasePool() first.');
  }
  return globalPool;
}

export async function withDatabasePool<T>(
  operation: (client: SupabaseClient<Database>) => Promise<T>,
  timeout?: number
): Promise<T> {
  const pool = getDatabasePool();
  const client = await pool.acquireConnection(timeout);
  
  try {
    return await operation(client);
  } finally {
    pool.releaseConnection(client);
  }
}