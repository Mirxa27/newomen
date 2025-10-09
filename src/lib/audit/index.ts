import { AuditLogger } from './auditLogger';
import { auditLoggers } from './presets';
import { AuditLoggerUtils } from './utils';
import { RequestLogger } from './requestLogger';
import { PerformanceLogger } from './performanceLogger';

export * from './types';
export { AuditLogger } from './auditLogger';
export { auditLoggers } from './presets';
export { AuditLoggerUtils } from './utils';
export { FileAuditStorage } from './FileAuditStorage';
export { DatabaseAuditStorage } from './DatabaseAuditStorage';
export { RequestLogger } from './requestLogger';
export { PerformanceLogger } from './performanceLogger';

// Export singleton logger instance
export const auditLogger = new AuditLogger();

// Common audit loggers
export const developmentAuditLogger = auditLoggers.development;
export const stagingAuditLogger = auditLoggers.staging;
export const productionAuditLogger = auditLoggers.production;
export const complianceAuditLogger = auditLoggers.compliance;

export const requestLogger = RequestLogger;
export const performanceLogger = PerformanceLogger;