import { logger } from '@/lib/logging';
import { AuditLevel, AuditEventType, type AuditLogEntry, type AuditLoggerConfig, defaultAuditLoggerConfig, type AuditStorage } from './types';
import { FileAuditStorage } from './FileAuditStorage';
import { DatabaseAuditStorage } from './DatabaseAuditStorage';

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
    metadata?: Record<string, unknown>;
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
    metadata?: Record<string, unknown>;
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
    metadata?: Record<string, unknown>;
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
    metadata?: Record<string, unknown>;
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
    metadata?: Record<string, unknown>;
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
    metadata?: Record<string, unknown>;
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
    metadata?: Record<string, unknown>;
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

  private maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
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