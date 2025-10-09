import { logger } from '@/lib/logging';
import { AuditError } from '@/lib/errors';

// Audit log levels
export enum AuditLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_FAILED = 'MFA_FAILED',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_DESTROYED = 'SESSION_DESTROYED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TOKEN_CREATED = 'TOKEN_CREATED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',

  // Authorization events
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  ACCESS_GRANTED = 'ACCESS_GRANTED',

  // Data access events
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_READ = 'DATA_READ',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_IMPORTED = 'DATA_IMPORTED',
  BULK_OPERATION = 'BULK_OPERATION',

  // User management events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_UNSUSPENDED = 'USER_UNSUSPENDED',
  USER_VERIFIED = 'USER_VERIFIED',
  USER_UNVERIFIED = 'USER_UNVERIFIED',

  // System events
  SYSTEM_STARTUP = 'SYSTEM_STARTUP',
  SYSTEM_SHUTDOWN = 'SYSTEM_SHUTDOWN',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  BACKUP_RESTORED = 'BACKUP_RESTORED',
  MAINTENANCE_START = 'MAINTENANCE_START',
  MAINTENANCE_END = 'MAINTENANCE_END',

  // Security events
  SECURITY_BREACH = 'SECURITY_BREACH',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  IP_BLOCKED = 'IP_BLOCKED',
  IP_UNBLOCKED = 'IP_UNBLOCKED',
  GEOGRAPHIC_ANOMALY = 'GEOGRAPHIC_ANOMALY',
  DEVICE_ANOMALY = 'DEVICE_ANOMALY',

  // Compliance events
  GDPR_REQUEST = 'GDPR_REQUEST',
  GDPR_EXPORT = 'GDPR_EXPORT',
  GDPR_DELETION = 'GDPR_DELETION',
  CCPA_REQUEST = 'CCPA_REQUEST',
  SOX_COMPLIANCE = 'SOX_COMPLIANCE',
  HIPAA_COMPLIANCE = 'HIPAA_COMPLIANCE',

  // Payment events
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',

  // API events
  API_CALL = 'API_CALL',
  API_ERROR = 'API_ERROR',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  WEBHOOK_RECEIVED = 'WEBHOOK_RECEIVED',
  WEBHOOK_SENT = 'WEBHOOK_SENT',

  // Custom events
  CUSTOM_EVENT = 'CUSTOM_EVENT',
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  level: AuditLevel;
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  errorMessage?: string;
  errorCode?: string;
  duration?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  compliance?: {
    gdpr?: boolean;
    ccpa?: boolean;
    sox?: boolean;
    hipaa?: boolean;
  };
  retention?: {
    keepForever?: boolean;
    deleteAfter?: Date;
  };
}

// Audit logger configuration
export interface AuditLoggerConfig {
  enabled: boolean;
  logLevel: AuditLevel;
  storage: 'file' | 'database' | 'both';
  filePath?: string;
  maxFileSize: number;
  maxFiles: number;
  compressLogs: boolean;
  encryptLogs: boolean;
  retentionDays: number;
  batchSize: number;
  flushInterval: number;
  includeStackTrace: boolean;
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  maskSensitiveData: boolean;
  sensitiveFields: string[];
  customSanitizers?: Record<string, (value: any) => any>;
}

// Default audit logger configuration
export const defaultAuditLoggerConfig: AuditLoggerConfig = {
  enabled: true,
  logLevel: AuditLevel.INFO,
  storage: 'file',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  compressLogs: true,
  encryptLogs: false,
  retentionDays: 90,
  batchSize: 100,
  flushInterval: 5000, // 5 seconds
  includeStackTrace: true,
  includeRequestBody: false,
  includeResponseBody: false,
  maskSensitiveData: true,
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'api_key',
    'credit_card',
    'ssn',
    'dob',
    'address',
  ],
};

// Audit storage interface
interface AuditStorage {
  store(logs: AuditLogEntry[]): Promise<void>;
  search(criteria: any): Promise<AuditLogEntry[]>;
  getStats(timeRange: any): Promise<any>;
  cleanup(retentionDays: number): Promise<void>;
}

// Audit logger class
export class AuditLogger {
  private config: AuditLoggerConfig;
  private logBuffer: AuditLogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private storage: AuditStorage;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = { ...defaultAuditLoggerConfig, ...config };
    this.storage = this.config.storage === 'database' ? new DatabaseAuditStorage(this.config) : new FileAuditStorage(this.config);
    this.startFlushTimer();
  }

  // Log an audit event
  async log(entry: Partial<AuditLogEntry>): Promise<void> {
    if (!this.config.enabled) return;

    const fullEntry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: entry.level || AuditLevel.INFO,
      eventType: entry.eventType || AuditEventType.CUSTOM_EVENT,
      ipAddress: entry.ipAddress || 'unknown',
      userAgent: entry.userAgent || 'unknown',
      action: entry.action || 'unknown_action',
      resource: entry.resource || 'unknown_resource',
      result: entry.result || 'SUCCESS',
      ...entry,
    };

    // Mask sensitive data
    if (this.config.maskSensitiveData && fullEntry.details) {
      fullEntry.details = this.maskSensitiveData(fullEntry.details);
    }

    // Add to buffer
    this.logBuffer.push(fullEntry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.config.batchSize) {
      await this.flush();
    }

    // Also log to main logger for immediate visibility
    this.logToMainLogger(fullEntry);
  }

  // Log authentication event
  async logAuth(event: {
    eventType: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGED' | 'TOKEN_CREATED';
    userId?: string;
    userEmail?: string;
    userRole?: string;
    sessionId?: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    errorMessage?: string;
    errorCode?: string;
    duration?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const eventTypeMap = {
      LOGIN: AuditEventType.LOGIN,
      LOGOUT: AuditEventType.LOGOUT,
      LOGIN_FAILED: AuditEventType.LOGIN_FAILED,
      PASSWORD_CHANGED: AuditEventType.PASSWORD_CHANGED,
      TOKEN_CREATED: AuditEventType.TOKEN_CREATED,
    };

    await this.log({
      level: event.success ? AuditLevel.INFO : AuditLevel.ERROR,
      eventType: eventTypeMap[event.eventType],
      userId: event.userId,
      userEmail: event.userEmail,
      userRole: event.userRole,
      sessionId: event.sessionId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      action: event.eventType.toLowerCase(),
      resource: 'authentication',
      result: event.success ? 'SUCCESS' : 'FAILURE',
      errorMessage: event.errorMessage,
      errorCode: event.errorCode,
      duration: event.duration,
      details: event.metadata,
    });
  }

  // Log authorization event
  async logAuthz(event: {
    userId: string;
    userEmail: string;
    userRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    granted: boolean;
    requiredPermissions?: string[];
    userPermissions?: string[];
    ipAddress: string;
    userAgent: string;
    reason?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      level: event.granted ? AuditLevel.INFO : AuditLevel.WARNING,
      eventType: event.granted ? AuditEventType.ACCESS_GRANTED : AuditEventType.ACCESS_DENIED,
      userId: event.userId,
      userEmail: event.userEmail,
      userRole: event.userRole,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      result: event.granted ? 'SUCCESS' : 'FAILURE',
      details: {
        requiredPermissions: event.requiredPermissions,
        userPermissions: event.userPermissions,
        reason: event.reason,
        ...event.metadata,
      },
    });
  }

  // Log data access event
  async logDataAccess(event: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT';
    resource: string;
    resourceId?: string;
    dataType: string;
    recordCount?: number;
    success: boolean;
    errorMessage?: string;
    ipAddress: string;
    userAgent: string;
    duration?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const eventTypeMap = {
      CREATE: AuditEventType.DATA_CREATED,
      READ: AuditEventType.DATA_READ,
      UPDATE: AuditEventType.DATA_UPDATED,
      DELETE: AuditEventType.DATA_DELETED,
      EXPORT: AuditEventType.DATA_EXPORTED,
      IMPORT: AuditEventType.DATA_IMPORTED,
    };

    await this.log({
      level: event.success ? AuditLevel.INFO : AuditLevel.ERROR,
      eventType: eventTypeMap[event.action],
      userId: event.userId,
      userEmail: event.userEmail,
      userRole: event.userRole,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      action: event.action.toLowerCase(),
      resource: event.resource,
      resourceId: event.resourceId,
      result: event.success ? 'SUCCESS' : 'FAILURE',
      errorMessage: event.errorMessage,
      duration: event.duration,
      details: {
        dataType: event.dataType,
        recordCount: event.recordCount,
        ...event.metadata,
      },
    });
  }

  // Log security event
  async logSecurity(event: {
    eventType: 'SECURITY_BREACH' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'IP_BLOCKED' | 'GEOGRAPHIC_ANOMALY';
    userId?: string;
    userEmail?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    ipAddress: string;
    userAgent: string;
    description: string;
    threatType?: string;
    riskScore?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const eventTypeMap = {
      SECURITY_BREACH: AuditEventType.SECURITY_BREACH,
      SUSPICIOUS_ACTIVITY: AuditEventType.SUSPICIOUS_ACTIVITY,
      RATE_LIMIT_EXCEEDED: AuditEventType.RATE_LIMIT_EXCEEDED,
      IP_BLOCKED: AuditEventType.IP_BLOCKED,
      GEOGRAPHIC_ANOMALY: AuditEventType.GEOGRAPHIC_ANOMALY,
    };

    const levelMap = {
      LOW: AuditLevel.WARNING,
      MEDIUM: AuditLevel.WARNING,
      HIGH: AuditLevel.ERROR,
      CRITICAL: AuditLevel.CRITICAL,
    };

    await this.log({
      level: levelMap[event.severity],
      eventType: eventTypeMap[event.eventType],
      userId: event.userId,
      userEmail: event.userEmail,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      action: event.eventType.toLowerCase(),
      resource: 'security',
      result: 'SUCCESS',
      details: {
        description: event.description,
        threatType: event.threatType,
        riskScore: event.riskScore,
        ...event.metadata,
      },
      tags: ['security', event.eventType.toLowerCase()],
    });
  }

  // Log compliance event
  async logCompliance(event: {
    regulation: 'GDPR' | 'CCPA' | 'SOX' | 'HIPAA';
    requestType: 'ACCESS' | 'DELETION' | 'EXPORT' | 'CORRECTION';
    userId?: string;
    userEmail?: string;
    dataSubjectId?: string;
    dataCategories?: string[];
    requestId?: string;
    success: boolean;
    errorMessage?: string;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const eventTypeMap = {
      GDPR: {
        ACCESS: AuditEventType.GDPR_REQUEST,
        DELETION: AuditEventType.GDPR_DELETION,
        EXPORT: AuditEventType.GDPR_EXPORT,
        CORRECTION: AuditEventType.GDPR_REQUEST,
      },
      CCPA: {
        ACCESS: AuditEventType.CCPA_REQUEST,
        DELETION: AuditEventType.CCPA_REQUEST,
        EXPORT: AuditEventType.CCPA_REQUEST,
        CORRECTION: AuditEventType.CCPA_REQUEST,
      },
      SOX: {
        ACCESS: AuditEventType.SOX_COMPLIANCE,
        DELETION: AuditEventType.SOX_COMPLIANCE,
        EXPORT: AuditEventType.SOX_COMPLIANCE,
        CORRECTION: AuditEventType.SOX_COMPLIANCE,
      },
      HIPAA: {
        ACCESS: AuditEventType.HIPAA_COMPLIANCE,
        DELETION: AuditEventType.HIPAA_COMPLIANCE,
        EXPORT: AuditEventType.HIPAA_COMPLIANCE,
        CORRECTION: AuditEventType.HIPAA_COMPLIANCE,
      },
    };

    const eventType = eventTypeMap[event.regulation][event.requestType];

    await this.log({
      level: event.success ? AuditLevel.INFO : AuditLevel.ERROR,
      eventType,
      userId: event.userId,
      userEmail: event.userEmail,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      action: `${event.regulation.toLowerCase()}_${event.requestType.toLowerCase()}`,
      resource: 'compliance',
      resourceId: event.requestId,
      result: event.success ? 'SUCCESS' : 'FAILURE',
      errorMessage: event.errorMessage,
      details: {
        dataSubjectId: event.dataSubjectId,
        dataCategories: event.dataCategories,
        ...event.metadata,
      },
      compliance: {
        [event.regulation.toLowerCase()]: true,
      },
      tags: ['compliance', event.regulation.toLowerCase()],
    });
  }

  // Log system event
  async logSystem(event: {
    eventType: 'STARTUP' | 'SHUTDOWN' | 'ERROR' | 'WARNING' | 'CONFIG_CHANGED' | 'BACKUP_CREATED' | 'MAINTENANCE_START' | 'MAINTENANCE_END';
    component?: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    metadata?: Record<string, any>;
    error?: Error;
  }): Promise<void> {
    const eventTypeMap = {
      STARTUP: AuditEventType.SYSTEM_STARTUP,
      SHUTDOWN: AuditEventType.SYSTEM_SHUTDOWN,
      ERROR: AuditEventType.SYSTEM_ERROR,
      WARNING: AuditEventType.SYSTEM_WARNING,
      CONFIG_CHANGED: AuditEventType.CONFIG_CHANGED,
      BACKUP_CREATED: AuditEventType.BACKUP_CREATED,
      MAINTENANCE_START: AuditEventType.MAINTENANCE_START,
      MAINTENANCE_END: AuditEventType.MAINTENANCE_END,
    };

    const levelMap = {
      LOW: AuditLevel.INFO,
      MEDIUM: AuditLevel.WARNING,
      HIGH: AuditLevel.ERROR,
      CRITICAL: AuditLevel.CRITICAL,
    };

    await this.log({
      level: levelMap[event.severity],
      eventType: eventTypeMap[event.eventType],
      ipAddress: 'system',
      userAgent: 'system',
      action: event.eventType.toLowerCase(),
      resource: event.component || 'system',
      result: event.error ? 'FAILURE' : 'SUCCESS',
      errorMessage: event.error?.message,
      details: {
        description: event.description,
        component: event.component,
        ...event.metadata,
      },
      tags: ['system', event.eventType.toLowerCase()],
    });
  }

  // Log payment event
  async logPayment(event: {
    eventType: 'PAYMENT_PROCESSED' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED' | 'SUBSCRIPTION_CREATED' | 'SUBSCRIPTION_CANCELLED' | 'SUBSCRIPTION_UPDATED';
    userId: string;
    userEmail: string;
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    transactionId?: string;
    subscriptionId?: string;
    success: boolean;
    errorMessage?: string;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const eventTypeMap = {
      PAYMENT_PROCESSED: AuditEventType.PAYMENT_PROCESSED,
      PAYMENT_FAILED: AuditEventType.PAYMENT_FAILED,
      PAYMENT_REFUNDED: AuditEventType.PAYMENT_REFUNDED,
      SUBSCRIPTION_CREATED: AuditEventType.SUBSCRIPTION_CREATED,
      SUBSCRIPTION_CANCELLED: AuditEventType.SUBSCRIPTION_CANCELLED,
      SUBSCRIPTION_UPDATED: AuditEventType.SUBSCRIPTION_UPDATED,
    };

    await this.log({
      level: event.success ? AuditLevel.INFO : AuditLevel.ERROR,
      eventType: eventTypeMap[event.eventType],
      userId: event.userId,
      userEmail: event.userEmail,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      action: event.eventType.toLowerCase(),
      resource: 'payment',
      resourceId: event.transactionId || event.subscriptionId,
      result: event.success ? 'SUCCESS' : 'FAILURE',
      errorMessage: event.errorMessage,
      details: {
        amount: event.amount,
        currency: event.currency,
        paymentMethod: event.paymentMethod,
        transactionId: event.transactionId,
        subscriptionId: event.subscriptionId,
        ...event.metadata,
      },
      tags: ['payment', event.eventType.toLowerCase()],
    });
  }

  // Flush buffered logs
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.storage.store(logsToFlush);
      logger.debug('Audit logs flushed', { count: logsToFlush.length });
    } catch (error) {
      logger.error('Failed to flush audit logs', { error, count: logsToFlush.length });
      // Re-add logs to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  // Search audit logs
  async search(criteria: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    eventType?: AuditEventType;
    level?: AuditLevel;
    resource?: string;
    result?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
    ipAddress?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    return this.storage.search(criteria);
  }

  // Get audit statistics
  async getStats(timeRange: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByLevel: Record<string, number>;
    eventsByResult: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
    topIpAddresses: Array<{ ipAddress: string; count: number }>;
  }> {
    return this.storage.getStats(timeRange);
  }

  // Private methods
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private maskSensitiveData(data: Record<string, any>): Record<string, any> {
    const masked = { ...data };

    for (const field of this.config.sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    }

    // Apply custom sanitizers
    for (const [key, sanitizer] of Object.entries(this.config.customSanitizers || {})) {
      if (masked[key]) {
        masked[key] = sanitizer(masked[key]);
      }
    }

    return masked;
  }

  private logToMainLogger(entry: AuditLogEntry): void {
    const logData = {
      auditId: entry.id,
      eventType: entry.eventType,
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      result: entry.result,
      ipAddress: entry.ipAddress,
    };

    switch (entry.level) {
      case AuditLevel.INFO:
        logger.info('Audit event', logData);
        break;
      case AuditLevel.WARNING:
        logger.warn('Audit event', logData);
        break;
      case AuditLevel.ERROR:
        logger.error('Audit event', logData);
        break;
      case AuditLevel.CRITICAL:
        logger.error('CRITICAL Audit event', logData);
        break;
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        logger.error('Failed to flush audit logs in timer', { error });
      });
    }, this.config.flushInterval);
  }

  // Cleanup
  async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    await this.flush();
  }
}

// File-based audit storage
class FileAuditStorage implements AuditStorage {
  private basePath: string;

  constructor(private config: AuditLoggerConfig) {
    this.basePath = config.filePath || './logs/audit';
    this.ensureDirectoryExists();
  }

  async store(logs: AuditLogEntry[]): Promise<void> {
    const filePath = this.getCurrentFilePath();
    const logContent = logs.map(log => JSON.stringify(log)).join('\n') + '\n';

    // Append to file
    const fs = require('fs').promises;
    await fs.appendFile(filePath, logContent);

    // Check if file needs rotation
    await this.rotateIfNeeded(filePath);
  }

  async search(criteria: any): Promise<AuditLogEntry[]> {
    // Simple file-based search implementation
    // In production, this would use a proper database
    const results: AuditLogEntry[] = [];
    const files = await this.getLogFiles();

    for (const file of files) {
      const logs = await this.readLogFile(file);
      for (const log of logs) {
        if (this.matchesCriteria(log, criteria)) {
          results.push(log);
        }
      }
    }

    return results;
  }

  async getStats(timeRange: any): Promise<any> {
    // Implementation for getting statistics
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsByLevel: {},
      eventsByResult: {},
      topUsers: [],
      topResources: [],
      topIpAddresses: [],
    };
  }

  async cleanup(retentionDays: number): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const files = await this.getLogFiles();
    for (const file of files) {
      const stats = await fs.stat(file);
      if (stats.mtime < cutoffDate) {
        await fs.unlink(file);
      }
    }
  }

  private getCurrentFilePath(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    return `${this.basePath}/audit-${dateStr}.log`;
  }

  private async ensureDirectoryExists(): Promise<void> {
    const fs = require('fs').promises;
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async rotateIfNeeded(filePath: string): Promise<void> {
    const fs = require('fs').promises;
    const stats = await fs.stat(filePath);
    
    if (stats.size > this.config.maxFileSize) {
      const timestamp = Date.now();
      const rotatedPath = `${filePath}.${timestamp}`;
      await fs.rename(filePath, rotatedPath);
      
      if (this.config.compressLogs) {
        await this.compressFile(rotatedPath);
      }
    }
  }

  private async compressFile(filePath: string): Promise<void> {
    const zlib = require('zlib');
    const fs = require('fs').promises;
    
    const input = await fs.readFile(filePath);
    const compressed = zlib.gzipSync(input);
    await fs.writeFile(`${filePath}.gz`, compressed);
    await fs.unlink(filePath);
  }

  private async getLogFiles(): Promise<string[]> {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const files = await fs.readdir(this.basePath);
      return files
        .filter((file: string) => file.startsWith('audit-') && file.endsWith('.log'))
        .map((file: string) => path.join(this.basePath, file))
        .sort()
        .reverse();
    } catch {
      return [];
    }
  }

  private async readLogFile(filePath: string): Promise<AuditLogEntry[]> {
    const fs = require('fs').promises;
    const logs: AuditLogEntry[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter((line: string) => line.trim());
      
      for (const line of lines) {
        try {
          const log = JSON.parse(line);
          logs.push(log);
        } catch {
          // Skip invalid lines
        }
      }
    } catch {
      // File might not exist or be readable
    }
    
    return logs;
  }

  private matchesCriteria(log: AuditLogEntry, criteria: any): boolean {
    if (criteria.startDate && log.timestamp < criteria.startDate) return false;
    if (criteria.endDate && log.timestamp > criteria.endDate) return false;
    if (criteria.userId && log.userId !== criteria.userId) return false;
    if (criteria.eventType && log.eventType !== criteria.eventType) return false;
    if (criteria.level && log.level !== criteria.level) return false;
    if (criteria.resource && log.resource !== criteria.resource) return false;
    if (criteria.result && log.result !== criteria.result) return false;
    if (criteria.ipAddress && log.ipAddress !== criteria.ipAddress) return false;
    if (criteria.tags && criteria.tags.length > 0) {
      if (!log.tags || !criteria.tags.some((tag: string) => log.tags!.includes(tag))) {
        return false;
      }
    }
    
    return true;
  }
}

// Database-based audit storage (placeholder)
class DatabaseAuditStorage implements AuditStorage {
  constructor(private config: AuditLoggerConfig) {}

  async store(logs: AuditLogEntry[]): Promise<void> {
    // Implementation for database storage
    // This would insert logs into a database table
    logger.debug('Storing audit logs in database', { count: logs.length });
  }

  async search(criteria: any): Promise<AuditLogEntry[]> {
    // Implementation for database search
    // This would query the database based on criteria
    return [];
  }

  async getStats(timeRange: any): Promise<any> {
    // Implementation for database statistics
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsByLevel: {},
      eventsByResult: {},
      topUsers: [],
      topResources: [],
      topIpAddresses: [],
    };
  }

  async cleanup(retentionDays: number): Promise<void> {
    // Implementation for database cleanup
    logger.debug('Cleaning up old audit logs from database', { retentionDays });
  }
}

// Audit logger utilities
export class AuditLoggerUtils {
  static generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static sanitizeUserAgent(userAgent: string): string {
    return userAgent.replace(/[^\w\s\-./()]/g, '').substring(0, 200);
  }

  static sanitizeIpAddress(ipAddress: string): string {
    // Remove port if present
    return ipAddress.split(':')[0];
  }

  static sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'credit_card'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***MASKED***';
      }
    }
    
    return sanitized;
  }

  static isComplianceEvent(eventType: AuditEventType): boolean {
    const complianceEvents = [
      AuditEventType.GDPR_REQUEST,
      AuditEventType.GDPR_EXPORT,
      AuditEventType.GDPR_DELETION,
      AuditEventType.CCPA_REQUEST,
      AuditEventType.SOX_COMPLIANCE,
      AuditEventType.HIPAA_COMPLIANCE,
    ];
    
    return complianceEvents.includes(eventType);
  }

  static getRetentionPeriod(eventType: AuditEventType): number {
    // Return retention period in days based on event type
    const retentionMap: Record<AuditEventType, number> = {
      [AuditEventType.LOGIN]: 365,
      [AuditEventType.LOGOUT]: 365,
      [AuditEventType.LOGIN_FAILED]: 365,
      [AuditEventType.PASSWORD_CHANGED]: 365,
      [AuditEventType.PASSWORD_RESET]: 365,
      [AuditEventType.MFA_ENABLED]: 365,
      [AuditEventType.MFA_DISABLED]: 365,
      [AuditEventType.MFA_FAILED]: 365,
      [AuditEventType.SESSION_CREATED]: 180,
      [AuditEventType.SESSION_DESTROYED]: 180,
      [AuditEventType.SESSION_EXPIRED]: 180,
      [AuditEventType.TOKEN_CREATED]: 365,
      [AuditEventType.TOKEN_REVOKED]: 365,
      [AuditEventType.API_KEY_CREATED]: 365,
      [AuditEventType.API_KEY_REVOKED]: 365,
      [AuditEventType.PERMISSION_GRANTED]: 365,
      [AuditEventType.PERMISSION_REVOKED]: 365,
      [AuditEventType.ROLE_ASSIGNED]: 365,
      [AuditEventType.ROLE_REMOVED]: 365,
      [AuditEventType.ACCESS_DENIED]: 365,
      [AuditEventType.ACCESS_GRANTED]: 365,
      [AuditEventType.DATA_CREATED]: 180,
      [AuditEventType.DATA_UPDATED]: 180,
      [AuditEventType.DATA_DELETED]: 180,
      [AuditEventType.DATA_READ]: 90,
      [AuditEventType.DATA_EXPORTED]: 365,
      [AuditEventType.DATA_IMPORTED]: 180,
      [AuditEventType.BULK_OPERATION]: 180,
      [AuditEventType.USER_CREATED]: 365,
      [AuditEventType.USER_UPDATED]: 365,
      [AuditEventType.USER_DELETED]: 365,
      [AuditEventType.USER_SUSPENDED]: 365,
      [AuditEventType.USER_UNSUSPENDED]: 365,
      [AuditEventType.USER_VERIFIED]: 365,
      [AuditEventType.USER_UNVERIFIED]: 365,
      [AuditEventType.SYSTEM_STARTUP]: 30,
      [AuditEventType.SYSTEM_SHUTDOWN]: 30,
      [AuditEventType.SYSTEM_ERROR]: 90,
      [AuditEventType.SYSTEM_WARNING]: 90,
      [AuditEventType.CONFIG_CHANGED]: 365,
      [AuditEventType.BACKUP_CREATED]: 365,
      [AuditEventType.BACKUP_RESTORED]: 365,
      [AuditEventType.MAINTENANCE_START]: 90,
      [AuditEventType.MAINTENANCE_END]: 90,
      [AuditEventType.SECURITY_BREACH]: 2555, // 7 years
      [AuditEventType.SUSPICIOUS_ACTIVITY]: 365,
      [AuditEventType.RATE_LIMIT_EXCEEDED]: 90,
      [AuditEventType.IP_BLOCKED]: 365,
      [AuditEventType.IP_UNBLOCKED]: 365,
      [AuditEventType.GEOGRAPHIC_ANOMALY]: 365,
      [AuditEventType.DEVICE_ANOMALY]: 365,
      [AuditEventType.GDPR_REQUEST]: 2555, // 7 years
      [AuditEventType.GDPR_EXPORT]: 2555, // 7 years
      [AuditEventType.GDPR_DELETION]: 2555, // 7 years
      [AuditEventType.CCPA_REQUEST]: 2555, // 7 years
      [AuditEventType.SOX_COMPLIANCE]: 2555, // 7 years
      [AuditEventType.HIPAA_COMPLIANCE]: 2555, // 7 years
      [AuditEventType.PAYMENT_PROCESSED]: 2555, // 7 years
      [AuditEventType.PAYMENT_FAILED]: 2555, // 7 years
      [AuditEventType.PAYMENT_REFUNDED]: 2555, // 7 years
      [AuditEventType.SUBSCRIPTION_CREATED]: 365,
      [AuditEventType.SUBSCRIPTION_CANCELLED]: 365,
      [AuditEventType.SUBSCRIPTION_UPDATED]: 365,
      [AuditEventType.API_CALL]: 90,
      [AuditEventType.API_ERROR]: 90,
      [AuditEventType.API_RATE_LIMITED]: 90,
      [AuditEventType.WEBHOOK_RECEIVED]: 180,
      [AuditEventType.WEBHOOK_SENT]: 180,
      [AuditEventType.CUSTOM_EVENT]: 180,
    };
    
    return retentionMap[eventType] || 180; // Default 6 months
  }
}

// Predefined audit loggers
export const auditLoggers = {
  // Development logger (minimal logging)
  development: new AuditLogger({
    enabled: true,
    logLevel: AuditLevel.INFO,
    storage: 'file',
    filePath: './logs/audit/development',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    retentionDays: 30,
    batchSize: 10,
    flushInterval: 10000, // 10 seconds
  }),

  // Staging logger (moderate logging)
  staging: new AuditLogger({
    enabled: true,
    logLevel: AuditLevel.WARNING,
    storage: 'file',
    filePath: './logs/audit/staging',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    retentionDays: 60,
    batchSize: 50,
    flushInterval: 5000, // 5 seconds
    encryptLogs: true,
  }),

  // Production logger (comprehensive logging)
  production: new AuditLogger({
    enabled: true,
    logLevel: AuditLevel.INFO,
    storage: 'both',
    filePath: './logs/audit/production',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 20,
    compressLogs: true,
    encryptLogs: true,
    retentionDays: 90,
    batchSize: 100,
    flushInterval: 3000, // 3 seconds
    maskSensitiveData: true,
  }),

  // Compliance logger (maximum logging for compliance)
  compliance: new AuditLogger({
    enabled: true,
    logLevel: AuditLevel.INFO,
    storage: 'both',
    filePath: './logs/audit/compliance',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 50,
    compressLogs: true,
    encryptLogs: true,
    retentionDays: 2555, // 7 years for compliance
    batchSize: 200,
    flushInterval: 1000, // 1 second
    maskSensitiveData: true,
    includeRequestBody: true,
    includeResponseBody: true,
  }),
};

// Export utilities and instances
export const auditLogger = new AuditLogger();
export const auditLoggerUtils = AuditLoggerUtils;

// Common audit loggers
export const developmentAuditLogger = auditLoggers.development;
export const stagingAuditLogger = auditLoggers.staging;
export const productionAuditLogger = auditLoggers.production;
export const complianceAuditLogger = auditLoggers.compliance;

// Default export
export default AuditLogger;