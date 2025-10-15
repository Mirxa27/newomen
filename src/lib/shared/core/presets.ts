import { AuditLogger } from './auditLogger';
import { AuditLevel } from './types';

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