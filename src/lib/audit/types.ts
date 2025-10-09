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
  details?: Record<string, unknown>;
  result: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  errorMessage?: string;
  errorCode?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
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
  customSanitizers?: Record<string, (value: unknown) => unknown>;
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
export interface AuditStorage {
  store(logs: AuditLogEntry[]): Promise<void>;
  search(criteria: Record<string, unknown>): Promise<AuditLogEntry[]>;
  getStats(timeRange: Record<string, unknown>): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByLevel: Record<string, number>;
    eventsByResult: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
    topIpAddresses: Array<{ ipAddress: string; count: number }>;
  }>;
  cleanup(retentionDays: number): Promise<void>;
}