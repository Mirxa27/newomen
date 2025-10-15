import { v4 as uuidv4 } from 'uuid';

// Log levels
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

// Logger configuration
export interface LoggerConfig {
  level?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  enableRemote?: boolean;
  filePath?: string;
  remoteEndpoint?: string;
  maxFileSize?: number;
  maxFiles?: number;
  enableColors?: boolean;
  enableTimestamps?: boolean;
  enableRequestId?: boolean;
  enableUserId?: boolean;
  enableSessionId?: boolean;
  enableMetadata?: boolean;
  enableErrorStack?: boolean;
  enablePerformanceTracking?: boolean;
}

// Structured logger
export class StructuredLogger {
  private static instance: StructuredLogger;
  private config: Required<LoggerConfig>;
  private transports: LogTransport[] = [];
  private context: Record<string, unknown> = {};
  private performanceMetrics: Map<string, number> = new Map();

  private constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      enableConsole: config.enableConsole ?? true,
      enableFile: config.enableFile ?? false,
      enableRemote: config.enableRemote ?? false,
      filePath: config.filePath ?? './logs/app.log',
      remoteEndpoint: config.remoteEndpoint ?? '',
      maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles ?? 5,
      enableColors: config.enableColors ?? true,
      enableTimestamps: config.enableTimestamps ?? true,
      enableRequestId: config.enableRequestId ?? true,
      enableUserId: config.enableUserId ?? true,
      enableSessionId: config.enableSessionId ?? true,
      enableMetadata: config.enableMetadata ?? true,
      enableErrorStack: config.enableErrorStack ?? true,
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
    };

    this.initializeTransports();
  }

  static getInstance(config?: LoggerConfig): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger(config);
    }
    return StructuredLogger.instance;
  }

  private initializeTransports(): void {
    if (this.config.enableConsole) {
      this.transports.push(new ConsoleTransport(this.config));
    }

    if (this.config.enableFile) {
      this.transports.push(new FileTransport(this.config));
    }

    if (this.config.enableRemote) {
      this.transports.push(new RemoteTransport(this.config));
    }
  }

  setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  startTimer(name: string): void {
    if (this.config.enablePerformanceTracking) {
      this.performanceMetrics.set(name, performance.now());
    }
  }

  endTimer(name: string): number | null {
    if (!this.config.enablePerformanceTracking) return null;

    const startTime = this.performanceMetrics.get(name);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.performanceMetrics.delete(name);

    this.debug(`Performance metric: ${name}`, { duration: `${duration.toFixed(2)}ms` });
    return duration;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      message,
      context: { ...this.context, ...context },
      error,
      metadata: {},
    };

    if (this.config.enableRequestId && typeof window !== 'undefined') {
      entry.requestId = (window as any).__requestId || uuidv4();
    }

    if (this.config.enableUserId && typeof window !== 'undefined') {
      entry.userId = (window as any).__userId;
    }

    if (this.config.enableSessionId && typeof window !== 'undefined') {
      entry.sessionId = (window as any).__sessionId;
    }

    return entry;
  }

  trace(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      const entry = this.createLogEntry(LogLevel.TRACE, message, context, error);
      this.write(entry);
    }
  }

  debug(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context, error);
      this.write(entry);
    }
  }

  info(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context, error);
      this.write(entry);
    }
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context, error);
      this.write(entry);
    }
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
      this.write(entry);
    }
  }

  fatal(message: string, context?: Record<string, unknown>, error?: Error): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      const entry = this.createLogEntry(LogLevel.FATAL, message, context, error);
      this.write(entry);
    }
  }

  private write(entry: LogEntry): void {
    this.transports.forEach(transport => {
      try {
        transport.write(entry);
      } catch (error) {
        console.error('Failed to write log entry:', error);
      }
    });
  }
}

// Log transport interface
export interface LogTransport {
  write(entry: LogEntry): void;
  close?(): Promise<void>;
}

// Console transport
export class ConsoleTransport implements LogTransport {
  constructor(private config: Required<LoggerConfig>) {}

  write(entry: LogEntry): void {
    const { timestamp, levelName, message, context, error, requestId, userId, sessionId } = entry;

    let logMessage = '';
    
    if (this.config.enableTimestamps) {
      logMessage += `[${timestamp}] `;
    }

    if (this.config.enableColors) {
      const color = this.getColorForLevel(entry.level);
      logMessage += `${color}[${levelName}]\x1b[0m `;
    } else {
      logMessage += `[${levelName}] `;
    }

    logMessage += message;

    if (requestId) logMessage += ` [Request: ${requestId}]`;
    if (userId) logMessage += ` [User: ${userId}]`;
    if (sessionId) logMessage += ` [Session: ${sessionId}]`;

    if (context && Object.keys(context).length > 0) {
      logMessage += ` | Context: ${JSON.stringify(context)}`;
    }

    if (error && this.config.enableErrorStack) {
      logMessage += `\n${error.stack || error.message}`;
    }

    // Use appropriate console method based on log level
    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage);
        break;
    }
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.TRACE: return '\x1b[90m'; // Gray
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m'; // Green
      case LogLevel.WARN: return '\x1b[33m'; // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.FATAL: return '\x1b[35m'; // Magenta
      default: return '\x1b[0m'; // Reset
    }
  }
}

// File transport (Node.js only)
export class FileTransport implements LogTransport {
  private writeStream: any;

  constructor(private config: Required<LoggerConfig>) {
    if (typeof window === 'undefined') {
      // Node.js environment
      const fs = require('fs');
      const path = require('path');
      
      const logDir = path.dirname(this.config.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      this.writeStream = fs.createWriteStream(this.config.filePath, { flags: 'a' });
    }
  }

  write(entry: LogEntry): void {
    if (!this.writeStream) return;

    const logLine = JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.levelName,
      message: entry.message,
      context: entry.context,
      error: entry.error ? {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
      } : undefined,
      requestId: entry.requestId,
      userId: entry.userId,
      sessionId: entry.sessionId,
      metadata: entry.metadata,
    }) + '\n';

    this.writeStream.write(logLine);
  }

  async close(): Promise<void> {
    if (this.writeStream) {
      return new Promise((resolve) => {
        this.writeStream.end(resolve);
      });
    }
  }
}

// Remote transport for centralized logging
export class RemoteTransport implements LogTransport {
  private queue: LogEntry[] = [];
  private isProcessing = false;
  private batchSize = 100;
  private flushInterval = 5000; // 5 seconds

  constructor(private config: Required<LoggerConfig>) {
    this.startBatchProcessor();
  }

  write(entry: LogEntry): void {
    this.queue.push(entry);
    
    if (this.queue.length >= this.batchSize) {
      this.processQueue();
    }
  }

  private startBatchProcessor(): void {
    setInterval(() => {
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }, this.flushInterval);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: batch.map(entry => ({
            timestamp: entry.timestamp,
            level: entry.levelName,
            message: entry.message,
            context: entry.context,
            error: entry.error ? {
              name: entry.error.name,
              message: entry.error.message,
            } : undefined,
            requestId: entry.requestId,
            userId: entry.userId,
            sessionId: entry.sessionId,
          })),
        }),
      });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // Re-add failed logs back to queue (with limit to prevent memory issues)
      if (this.queue.length < this.batchSize * 10) {
        this.queue.unshift(...batch.slice(0, this.batchSize / 2));
      }
    } finally {
      this.isProcessing = false;
    }
  }
}

// Request logger middleware
export class RequestLogger {
  static middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      const requestId = uuidv4();
      
      // Add request ID to request object
      req.id = requestId;
      (req as any).__requestId = requestId;

      // Log request
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
      });

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = function(chunk: any, encoding?: any) {
        const duration = Date.now() - startTime;
        
        logger.info('Request completed', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        });

        res.end = originalEnd;
        res.end(chunk, encoding);
      };

      next();
    };
  }
}

// Performance logger
export class PerformanceLogger {
  private static metrics = new Map<string, number[]>();

  static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  static getMetrics(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  static getAverage(name: string): number {
    const values = this.getMetrics(name);
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static getPercentile(name: string, percentile: number): number {
    const values = this.getMetrics(name).sort((a, b) => a - b);
    if (values.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  static clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  static getSummary(): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  }> {
    const summary: Record<string, any> = {};
    
    for (const [name, values] of this.metrics) {
      if (values.length === 0) continue;
      
      const sorted = values.sort((a, b) => a - b);
      summary[name] = {
        count: values.length,
        average: this.getAverage(name),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: this.getPercentile(name, 50),
        p95: this.getPercentile(name, 95),
        p99: this.getPercentile(name, 99),
      };
    }
    
    return summary;
  }
}

// Export singleton logger instance
export const logger = StructuredLogger.getInstance({
  level: LogLevel.INFO,
  enableConsole: true,
  enableColors: true,
  enableTimestamps: true,
  enableRequestId: true,
  enableUserId: true,
  enableSessionId: true,
  enableErrorStack: true,
  enablePerformanceTracking: true,
});

// Export utilities
export const requestLogger = RequestLogger;
export const performanceLogger = PerformanceLogger;

// Export convenience functions for logging
export const logTrace = (message: string, context?: Record<string, unknown>, error?: Error) =>
  logger.trace(message, context, error);

export const logDebug = (message: string, context?: Record<string, unknown>, error?: Error) =>
  logger.debug(message, context, error);

export const logInfo = (message: string, context?: Record<string, unknown>, error?: Error) =>
  logger.info(message, context, error);

export const logWarn = (message: string, context?: Record<string, unknown>, error?: Error) =>
  logger.warn(message, context, error);

export const logError = (message: string, context?: Record<string, unknown>, error?: Error) =>
  logger.error(message, context, error);

export const logFatal = (message: string, context?: Record<string, unknown>, error?: Error) =>
  logger.fatal(message, context, error);