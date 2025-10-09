import { AuditEventType } from './types';

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

  static sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
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
    const retentionMap: Record<string, number> = {
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