import { logger } from '@/lib/logging';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// User authentication info
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
}

// Authentication result
export interface AuthResult {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
}

// Session data interface
export interface SessionData {
  user: User | null;
  session: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    expires_at?: number;
  } | null;
}

// Authentication configuration
export interface AuthConfig {
  sessionTimeout: number;
  maxSessions: number;
  requireHttps: boolean;
  enableCsrf: boolean;
  enableRateLimit: boolean;
  allowedOrigins: string[];
  corsEnabled: boolean;
}

// Default authentication configuration
export const defaultAuthConfig: AuthConfig = {
  sessionTimeout: 1800, // 30 minutes
  maxSessions: 5,
  requireHttps: true,
  enableCsrf: true,
  enableRateLimit: true,
  allowedOrigins: [],
  corsEnabled: true,
};

// Authentication utility class for frontend
export class AuthService {
  private config: AuthConfig;
  private sessions = new Map<string, AuthUser>();

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...defaultAuthConfig, ...config };
  }

  // Check if user is authenticated with Supabase
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user !== null;
    } catch (error) {
      logger.error('Authentication check failed', { error });
      return false;
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      logger.error('Failed to get current user', { error });
      return null;
    }
  }

  // Convert Supabase user to AuthUser
  private convertToAuthUser(user: User): AuthUser {
    // Extract role from user metadata or default to 'user'
    const role = (user.user_metadata?.role as string) || 'user';
    const permissions = (user.user_metadata?.permissions as string[]) || [];
    
    return {
      id: user.id,
      email: user.email || '',
      role,
      permissions,
      sessionId: user.id, // Use user ID as session ID for now
      createdAt: new Date(user.created_at),
      lastActivity: new Date(),
    };
  }

  // Check if user has required permissions
  hasRequiredPermissions(user: AuthUser, requiredPermissions: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    return requiredPermissions.every(permission =>
      user.permissions.includes(permission) || user.role === 'admin'
    );
  }

  // Role-based authorization check
  hasRole(user: AuthUser, allowedRoles: string[]): boolean {
    return allowedRoles.includes(user.role);
  }

  // Permission-based authorization check
  hasPermissions(user: AuthUser, requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission =>
      user.permissions.includes(permission) || user.role === 'admin'
    );
  }

  // Session management
  createSession(user: User): AuthUser {
    const authUser = this.convertToAuthUser(user);
    this.sessions.set(user.id, authUser);
    return authUser;
  }

  destroySession(userId: string): boolean {
    return this.sessions.delete(userId);
  }

  getSession(userId: string): AuthUser | undefined {
    return this.sessions.get(userId);
  }

  getAllSessions(): Map<string, AuthUser> {
    return new Map(this.sessions);
  }

  clearExpiredSessions(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [sessionId, user] of this.sessions) {
      const lastActivity = user.lastActivity.getTime();
      if (now - lastActivity > this.config.sessionTimeout * 1000) {
        this.sessions.delete(sessionId);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info('Cleared expired sessions', { count: cleared });
    }

    return cleared;
  }

  // Update session activity
  updateSessionActivity(user: AuthUser): void {
    user.lastActivity = new Date();
    
    // Update in sessions map
    for (const [sessionId, sessionUser] of this.sessions) {
      if (sessionUser.id === user.id) {
        this.sessions.set(sessionId, user);
        break;
      }
    }
  }

  // Get authentication statistics
  getStats(): {
    activeSessions: number;
    config: AuthConfig;
    uptime: number;
  } {
    return {
      activeSessions: this.sessions.size,
      config: { ...this.config },
      uptime: Date.now(),
    };
  }

  // Update configuration
  updateConfig(config: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Authentication configuration updated');
  }

  // Get current configuration
  getConfig(): AuthConfig {
    return { ...this.config };
  }
}

// JWT utilities for token handling
export class JwtUtils {
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp && payload.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }

  static decodeToken(token: string): Record<string, unknown> | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
}

// Authentication utilities
export class AuthUtils {
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateCsrfToken(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  static async hashPassword(password: string): Promise<string> {
    // Use Web Crypto API for password hashing in browser
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) return '***';
    return `${apiKey.substring(0, 4)}***${apiKey.substring(apiKey.length - 4)}`;
  }

  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `**@${domain}`;
    return `${local.substring(0, 2)}***@${domain}`;
  }

  static isStrongPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number, one special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  }

  static sanitizeUserAgent(userAgent: string): string {
    return userAgent.replace(/[^\w\s\-./()]/g, '').substring(0, 200);
  }

  static getClientIp(): string {
    // In browser environment, we can't get the real client IP
    // This would typically come from the server or a service
    return 'unknown';
  }

  static getUserFingerprint(): string {
    // Generate a simple fingerprint based on available browser info
    const userAgent = navigator.userAgent || '';
    const language = navigator.language || '';
    const platform = navigator.platform || '';
    
    // Simple hash function
    const hash = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    };

    return hash(`${userAgent}|${language}|${platform}`).toString(36);
  }
}

// Predefined authentication configurations
export const authConfigs = {
  development: {
    sessionTimeout: 1800,
    maxSessions: 5,
    requireHttps: false,
    enableCsrf: false,
    enableRateLimit: false,
  },

  staging: {
    sessionTimeout: 1800,
    maxSessions: 5,
    requireHttps: true,
    enableCsrf: true,
    enableRateLimit: true,
  },

  production: {
    sessionTimeout: 900, // 15 minutes
    maxSessions: 5,
    requireHttps: true,
    enableCsrf: true,
    enableRateLimit: true,
  },
};

// Export utilities and instances
export const authService = new AuthService();
export const jwtUtils = JwtUtils;
export const authUtils = AuthUtils;

// Default export
export default AuthService;