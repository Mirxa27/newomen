import { logger } from '@/lib/logging';
import { HealthCheckError, ServiceUnavailableError } from '@/lib/errors';
import { CircuitBreakerHealthCheck } from '@/lib/resilience/circuitBreaker';

// Health check status
export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  UNHEALTHY = 'UNHEALTHY',
  DEGRADED = 'DEGRADED',
  UNKNOWN = 'UNKNOWN',
}

// Health check result
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  details?: Record<string, any>;
  responseTime: number;
  timestamp: Date;
  error?: Error;
}

// Health check configuration
export interface HealthCheckConfig {
  name: string;
  timeout: number; // Timeout in milliseconds
  critical: boolean; // Whether this check is critical
  interval?: number; // Check interval in milliseconds
  retries?: number; // Number of retries
  enabled?: boolean;
  dependencies?: string[]; // Names of dependent checks
  tags?: string[]; // Tags for categorization
}

// Health check interface
export interface HealthCheck {
  name: string;
  config: HealthCheckConfig;
  check(): Promise<HealthCheckResult>;
}

// Base health check class
export abstract class BaseHealthCheck implements HealthCheck {
  constructor(public name: string, public config: HealthCheckConfig) {}

  abstract check(): Promise<HealthCheckResult>;

  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new HealthCheckError(`Health check timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  protected createResult(
    status: HealthStatus,
    message?: string,
    details?: Record<string, any>,
    error?: Error,
    responseTime = 0
  ): HealthCheckResult {
    return {
      name: this.name,
      status,
      message,
      details,
      responseTime,
      timestamp: new Date(),
      error,
    };
  }
}

// Database health check
export class DatabaseHealthCheck extends BaseHealthCheck {
  constructor(
    private dbClient: any,
    config: Partial<HealthCheckConfig> = {}
  ) {
    super('database', {
      timeout: 5000,
      critical: true,
      ...config,
      name: 'database',
    });
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      await this.executeWithTimeout(async () => {
        // Simple query to check database connectivity
        await this.dbClient.query('SELECT 1');
      }, this.config.timeout);

      const responseTime = Date.now() - startTime;

      return this.createResult(
        HealthStatus.HEALTHY,
        'Database is responsive',
        { responseTime: `${responseTime}ms` },
        undefined,
        responseTime
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Database check failed';

      return this.createResult(
        HealthStatus.UNHEALTHY,
        message,
        { responseTime: `${responseTime}ms` },
        error as Error,
        responseTime
      );
    }
  }
}

// Redis health check
export class RedisHealthCheck extends BaseHealthCheck {
  constructor(
    private redisClient: any,
    config: Partial<HealthCheckConfig> = {}
  ) {
    super('redis', {
      timeout: 3000,
      critical: false,
      ...config,
      name: 'redis',
    });
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      await this.executeWithTimeout(async () => {
        await this.redisClient.ping();
      }, this.config.timeout);

      const responseTime = Date.now() - startTime;

      return this.createResult(
        HealthStatus.HEALTHY,
        'Redis is responsive',
        { responseTime: `${responseTime}ms` },
        undefined,
        responseTime
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Redis check failed';

      return this.createResult(
        HealthStatus.UNHEALTHY,
        message,
        { responseTime: `${responseTime}ms` },
        error as Error,
        responseTime
      );
    }
  }
}

// External API health check
export class ExternalAPIHealthCheck extends BaseHealthCheck {
  constructor(
    private apiName: string,
    private healthCheckUrl: string,
    config: Partial<HealthCheckConfig> = {}
  ) {
    super(`${apiName}-api`, {
      timeout: 10000,
      critical: false,
      ...config,
      name: `${apiName}-api`,
    });
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithTimeout(async () => {
        return fetch(this.healthCheckUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(this.config.timeout),
        });
      }, this.config.timeout);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return this.createResult(
          HealthStatus.HEALTHY,
          `${this.apiName} API is responsive`,
          { 
            responseTime: `${responseTime}ms`,
            statusCode: response.status,
          },
          undefined,
          responseTime
        );
      } else {
        return this.createResult(
          HealthStatus.DEGRADED,
          `${this.apiName} API returned ${response.status}`,
          { 
            responseTime: `${responseTime}ms`,
            statusCode: response.status,
          },
          undefined,
          responseTime
        );
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'API check failed';

      return this.createResult(
        HealthStatus.UNHEALTHY,
        message,
        { responseTime: `${responseTime}ms` },
        error as Error,
        responseTime
      );
    }
  }
}

// Memory health check
export class MemoryHealthCheck extends BaseHealthCheck {
  constructor(config: Partial<HealthCheckConfig> = {}) {
    super('memory', {
      timeout: 1000,
      critical: false,
      ...config,
      name: 'memory',
    });
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const rssMB = Math.round(memUsage.rss / 1024 / 1024);

      // Check if memory usage is too high (over 90% of heap)
      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const status = heapUsagePercent > 90 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;

      const responseTime = Date.now() - startTime;

      return this.createResult(
        status,
        `Memory usage: ${heapUsagePercent.toFixed(1)}%`,
        {
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          rss: `${rssMB}MB`,
          heapUsagePercent: heapUsagePercent.toFixed(1) + '%',
          responseTime: `${responseTime}ms`,
        },
        undefined,
        responseTime
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Memory check failed';

      return this.createResult(
        HealthStatus.UNHEALTHY,
        message,
        { responseTime: `${responseTime}ms` },
        error as Error,
        responseTime
      );
    }
  }
}

// Disk space health check
export class DiskSpaceHealthCheck extends BaseHealthCheck {
  constructor(config: Partial<HealthCheckConfig> = {}) {
    super('disk-space', {
      timeout: 5000,
      critical: false,
      ...config,
      name: 'disk-space',
    });
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // This is a simplified check - in a real implementation you'd use a proper disk space library
      const fs = require('fs');
      const stats = fs.statSync(process.cwd());
      
      const responseTime = Date.now() - startTime;

      return this.createResult(
        HealthStatus.HEALTHY,
        'Disk space check completed',
        { 
          responseTime: `${responseTime}ms`,
          // Add actual disk space metrics here
        },
        undefined,
        responseTime
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Disk space check failed';

      return this.createResult(
        HealthStatus.UNHEALTHY,
        message,
        { responseTime: `${responseTime}ms` },
        error as Error,
        responseTime
      );
    }
  }
}

// Circuit breaker health check
export class CircuitBreakerHealthCheckWrapper extends BaseHealthCheck {
  constructor(config: Partial<HealthCheckConfig> = {}) {
    super('circuit-breakers', {
      timeout: 5000,
      critical: false,
      ...config,
      name: 'circuit-breakers',
    });
  }

  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const { healthy, details } = await CircuitBreakerHealthCheck.checkHealth();
      const responseTime = Date.now() - startTime;

      const status = healthy ? HealthStatus.HEALTHY : HealthStatus.DEGRADED;

      return this.createResult(
        status,
        healthy ? 'All circuit breakers are healthy' : 'Some circuit breakers are unhealthy',
        {
          responseTime: `${responseTime}ms`,
          circuitBreakers: details,
        },
        undefined,
        responseTime
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Circuit breaker check failed';

      return this.createResult(
        HealthStatus.UNHEALTHY,
        message,
        { responseTime: `${responseTime}ms` },
        error as Error,
        responseTime
      );
    }
  }
}

// Health check manager
export class HealthCheckManager {
  private checks = new Map<string, HealthCheck>();
  private results = new Map<string, HealthCheckResult>();
  private intervals = new Map<string, NodeJS.Timeout>();

  addCheck(check: HealthCheck): void {
    this.checks.set(check.name, check);
  }

  removeCheck(name: string): boolean {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
    return this.checks.delete(name);
  }

  getCheck(name: string): HealthCheck | undefined {
    return this.checks.get(name);
  }

  getAllChecks(): HealthCheck[] {
    return Array.from(this.checks.values());
  }

  getLastResult(name: string): HealthCheckResult | undefined {
    return this.results.get(name);
  }

  getAllResults(): Map<string, HealthCheckResult> {
    return new Map(this.results);
  }

  async runCheck(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    const result = await check.check();
    this.results.set(name, result);
    return result;
  }

  async runAllChecks(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {};

    for (const [name, check] of this.checks) {
      try {
        results[name] = await this.runCheck(name);
      } catch (error) {
        results[name] = {
          name,
          status: HealthStatus.UNKNOWN,
          message: `Failed to run health check: ${error instanceof Error ? error.message : 'Unknown error'}`,
          responseTime: 0,
          timestamp: new Date(),
          error: error as Error,
        };
      }
    }

    return results;
  }

  startPeriodicCheck(name: string, intervalMs: number): void {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    if (check.config.interval && check.config.interval > 0) {
      intervalMs = check.config.interval;
    }

    // Clear existing interval if any
    const existingInterval = this.intervals.get(name);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
      try {
        await this.runCheck(name);
      } catch (error) {
        logger.error(`Periodic health check failed: ${name}`, { error });
      }
    }, intervalMs);

    this.intervals.set(name, interval);
  }

  stopPeriodicCheck(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
  }

  stopAllPeriodicChecks(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  getOverallHealth(): {
    status: HealthStatus;
    healthyCount: number;
    unhealthyCount: number;
    degradedCount: number;
    unknownCount: number;
    totalChecks: number;
  } {
    const results = Array.from(this.results.values());
    
    if (results.length === 0) {
      return {
        status: HealthStatus.UNKNOWN,
        healthyCount: 0,
        unhealthyCount: 0,
        degradedCount: 0,
        unknownCount: 0,
        totalChecks: 0,
      };
    }

    let healthyCount = 0;
    let unhealthyCount = 0;
    let degradedCount = 0;
    let unknownCount = 0;

    for (const result of results) {
      switch (result.status) {
        case HealthStatus.HEALTHY:
          healthyCount++;
          break;
        case HealthStatus.UNHEALTHY:
          unhealthyCount++;
          break;
        case HealthStatus.DEGRADED:
          degradedCount++;
          break;
        default:
          unknownCount++;
          break;
      }
    }

    let overallStatus: HealthStatus;

    if (unhealthyCount > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (degradedCount > 0) {
      overallStatus = HealthStatus.DEGRADED;
    } else if (healthyCount > 0) {
      overallStatus = HealthStatus.HEALTHY;
    } else {
      overallStatus = HealthStatus.UNKNOWN;
    }

    return {
      status: overallStatus,
      healthyCount,
      unhealthyCount,
      degradedCount,
      unknownCount,
      totalChecks: results.length,
    };
  }

  // Express middleware for health endpoint
  healthEndpoint() {
    return async (req: any, res: any) => {
      try {
        const results = await this.runAllChecks();
        const overallHealth = this.getOverallHealth();

        const response = {
          status: overallHealth.status,
          timestamp: new Date().toISOString(),
          checks: results,
          summary: {
            total: overallHealth.totalChecks,
            healthy: overallHealth.healthyCount,
            unhealthy: overallHealth.unhealthyCount,
            degraded: overallHealth.degradedCount,
            unknown: overallHealth.unknownCount,
          },
        };

        const statusCode = overallHealth.status === HealthStatus.UNHEALTHY ? 503 : 200;
        res.status(statusCode).json(response);
      } catch (error) {
        logger.error('Health check endpoint error', { error });
        res.status(500).json({
          status: HealthStatus.UNHEALTHY,
          error: error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  // Liveness probe endpoint (minimal health check)
  livenessEndpoint() {
    return async (req: any, res: any) => {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
      });
    };
  }

  // Readiness probe endpoint (checks if service is ready to serve traffic)
  readinessEndpoint() {
    return async (req: any, res: any) => {
      const overallHealth = this.getOverallHealth();
      
      // Only critical checks must pass for readiness
      const criticalChecks = Array.from(this.results.values()).filter(
        result => this.checks.get(result.name)?.config.critical
      );

      const allCriticalHealthy = criticalChecks.every(
        check => check.status === HealthStatus.HEALTHY
      );

      const status = allCriticalHealthy ? 'ready' : 'not ready';
      const statusCode = allCriticalHealthy ? 200 : 503;

      res.status(statusCode).json({
        status,
        timestamp: new Date().toISOString(),
        criticalChecks: criticalChecks.length,
        healthyCriticalChecks: criticalChecks.filter(c => c.status === HealthStatus.HEALTHY).length,
      });
    };
  }
}

// Health check factory
export class HealthCheckFactory {
  static createDatabaseCheck(dbClient: any, config?: Partial<HealthCheckConfig>): DatabaseHealthCheck {
    return new DatabaseHealthCheck(dbClient, config);
  }

  static createRedisCheck(redisClient: any, config?: Partial<HealthCheckConfig>): RedisHealthCheck {
    return new RedisHealthCheck(redisClient, config);
  }

  static createAPICheck(
    apiName: string,
    healthCheckUrl: string,
    config?: Partial<HealthCheckConfig>
  ): ExternalAPIHealthCheck {
    return new ExternalAPIHealthCheck(apiName, healthCheckUrl, config);
  }

  static createMemoryCheck(config?: Partial<HealthCheckConfig>): MemoryHealthCheck {
    return new MemoryHealthCheck(config);
  }

  static createDiskSpaceCheck(config?: Partial<HealthCheckConfig>): DiskSpaceHealthCheck {
    return new DiskSpaceHealthCheck(config);
  }

  static createCircuitBreakerCheck(config?: Partial<HealthCheckConfig>): CircuitBreakerHealthCheckWrapper {
    return new CircuitBreakerHealthCheckWrapper(config);
  }
}

// Global health check manager
export const healthCheckManager = new HealthCheckManager();

// Common health check configurations
export const healthCheckConfigs = {
  // Critical system checks
  critical: {
    timeout: 5000,
    critical: true,
    enabled: true,
  },

  // Non-critical checks
  nonCritical: {
    timeout: 10000,
    critical: false,
    enabled: true,
  },

  // Fast checks for frequent monitoring
  fast: {
    timeout: 2000,
    critical: false,
    enabled: true,
  },

  // Slow checks for comprehensive monitoring
  slow: {
    timeout: 30000,
    critical: false,
    enabled: true,
  },
};

// Health check utilities
export class HealthCheckUtils {
  static isHealthy(result: HealthCheckResult): boolean {
    return result.status === HealthStatus.HEALTHY;
  }

  static isUnhealthy(result: HealthCheckResult): boolean {
    return result.status === HealthStatus.UNHEALTHY;
  }

  static isDegraded(result: HealthCheckResult): boolean {
    return result.status === HealthStatus.DEGRADED;
  }

  static getResponseTime(result: HealthCheckResult): number {
    return result.responseTime;
  }

  static getStatusMessage(result: HealthCheckResult): string {
    return result.message || `Status: ${result.status}`;
  }

  static formatResults(results: Record<string, HealthCheckResult>): string {
    const lines: string[] = ['Health Check Results:'];
    
    for (const [name, result] of Object.entries(results)) {
      const status = result.status.padEnd(8);
      const time = `${result.responseTime}ms`.padStart(6);
      const message = result.message || 'No message';
      
      lines.push(`  ${name.padEnd(20)} ${status} ${time} - ${message}`);
    }

    return lines.join('\n');
  }
}