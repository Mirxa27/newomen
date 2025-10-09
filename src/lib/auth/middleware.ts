import { logger } from '@/lib/logging';
import { AuthenticationError, AuthorizationError, ValidationError } from '@/lib/errors';
import { JWTUtil, keyManager } from '@/lib/security/keyManager';

// Authentication configuration
export interface AuthConfig {
  secretKey: string;
  tokenExpiration: number;
  refreshTokenExpiration: number;
  apiKeyHeader: string;
  authHeader: string;
  tokenPrefix: string;
  sessionTimeout: number;
  maxSessions: number;
  requireHttps: boolean;
  enableCsrf: boolean;
  enableRateLimit: boolean;
  allowedOrigins: string[];
  corsEnabled: boolean;
}

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

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  permissions?: string[];
  sessionId?: string;
  iat: number;
  exp: number;
}

// Default authentication configuration
export const defaultAuthConfig: AuthConfig = {
  secretKey: process.env.JWT_SECRET || 'your-secret-key',
  tokenExpiration: 3600, // 1 hour
  refreshTokenExpiration: 604800, // 7 days
  apiKeyHeader: 'X-API-Key',
  authHeader: 'Authorization',
  tokenPrefix: 'Bearer',
  sessionTimeout: 1800, // 30 minutes
  maxSessions: 5,
  requireHttps: true,
  enableCsrf: true,
  enableRateLimit: true,
  allowedOrigins: [],
  corsEnabled: true,
};

// Authentication middleware class
export class AuthMiddleware {
  private config: AuthConfig;
  private sessions = new Map<string, AuthUser>();

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...defaultAuthConfig, ...config };
  }

  // Main authentication middleware
  authenticate() {
    return async (req: any, res: any, next: any) => {
      try {
        // Check if authentication is required for this route
        if (this.isPublicRoute(req)) {
          return next();
        }

        // Extract authentication credentials
        const authHeader = req.headers[this.config.authHeader.toLowerCase()];
        const apiKey = req.headers[this.config.apiKeyHeader.toLowerCase()];

        let user: AuthUser | null = null;

        if (apiKey) {
          // API key authentication
          user = await this.authenticateApiKey(apiKey);
        } else if (authHeader) {
          // Bearer token authentication
          user = await this.authenticateBearerToken(authHeader);
        } else {
          // Check for session-based authentication
          user = await this.authenticateSession(req);
        }

        if (!user) {
          throw new AuthenticationError('Authentication required');
        }

        // Check user permissions
        if (!this.hasRequiredPermissions(req, user)) {
          throw new AuthorizationError('Insufficient permissions');
        }

        // Update session activity
        this.updateSessionActivity(user);

        // Attach user to request
        req.user = user;
        req.auth = {
          user,
          authenticated: true,
          method: apiKey ? 'api_key' : 'bearer_token',
        };

        next();
      } catch (error) {
        logger.error('Authentication failed', { 
          error, 
          path: req.path, 
          method: req.method,
          ip: req.ip 
        });

        if (error instanceof AuthenticationError) {
          return res.status(401).json({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            }
          });
        }

        if (error instanceof AuthorizationError) {
          return res.status(403).json({
            error: {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            }
          });
        }

        return res.status(500).json({
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Authentication system error',
            timestamp: new Date().toISOString(),
          }
        });
      }
    };
  }

  // API key authentication
  private async authenticateApiKey(apiKey: string): Promise<AuthUser | null> {
    try {
      const { valid } = keyManager.validateAPIKey(apiKey);
      if (!valid) {
        return null;
      }

      // Get user info from API key
      const userInfo = this.getUserFromApiKey(apiKey);
      if (!userInfo) {
        return null;
      }

      return {
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.role,
        permissions: userInfo.permissions || [],
        sessionId: `api_${Date.now()}`,
        createdAt: new Date(),
        lastActivity: new Date(),
      };
    } catch (error) {
      logger.error('API key authentication failed', { error });
      return null;
    }
  }

  // Bearer token authentication
  private async authenticateBearerToken(authHeader: string): Promise<AuthUser | null> {
    try {
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== this.config.tokenPrefix) {
        return null;
      }

      const token = parts[1];
      const payload = JWTUtil.verify(token, this.config.secretKey) as JwtPayload;

      if (!payload || !payload.userId) {
        return null;
      }

      // Check token expiration
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new AuthenticationError('Token has expired');
      }

      return {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        permissions: payload.permissions || [],
        sessionId: payload.sessionId || `token_${Date.now()}`,
        createdAt: new Date(payload.iat * 1000),
        lastActivity: new Date(),
      };
    } catch (error) {
      logger.error('Bearer token authentication failed', { error });
      return null;
    }
  }

  // Session-based authentication
  private async authenticateSession(req: any): Promise<AuthUser | null> {
    try {
      const sessionId = req.session?.id || req.cookies?.sessionId;
      if (!sessionId) {
        return null;
      }

      const user = this.sessions.get(sessionId);
      if (!user) {
        return null;
      }

      // Check session timeout
      const now = Date.now();
      const lastActivity = user.lastActivity.getTime();
      if (now - lastActivity > this.config.sessionTimeout * 1000) {
        this.sessions.delete(sessionId);
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Session authentication failed', { error });
      return null;
    }
  }

  // Check if route is public
  private isPublicRoute(req: any): boolean {
    const publicRoutes = [
      '/health',
      '/health/',
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/public',
    ];

    const publicPatterns = [
      /^\/api\/public\//,
      /^\/health/,
      /^\/api\/health/,
    ];

    return publicRoutes.includes(req.path) || publicPatterns.some(pattern => pattern.test(req.path));
  }

  // Check if user has required permissions
  private hasRequiredPermissions(req: any, user: AuthUser): boolean {
    const requiredPermissions = this.getRequiredPermissions(req);
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    return requiredPermissions.every(permission => 
      user.permissions.includes(permission) || user.role === 'admin'
    );
  }

  // Get required permissions for route
  private getRequiredPermissions(req: any): string[] {
    // This would typically come from route metadata or configuration
    const routePermissions: Record<string, string[]> = {
      '/api/admin': ['admin_access'],
      '/api/users': ['user_management'],
      '/api/billing': ['billing_access'],
      '/api/reports': ['report_access'],
    };

    return routePermissions[req.path] || [];
  }

  // Get user info from API key
  private getUserFromApiKey(apiKey: string): any {
    // This would typically involve database lookup
    // For now, return mock data
    return {
      id: 'api_user_123',
      email: 'api@example.com',
      role: 'api',
      permissions: ['api_access'],
    };
  }

  // Update session activity
  private updateSessionActivity(user: AuthUser): void {
    user.lastActivity = new Date();
    
    // Update in sessions map if it's a session-based auth
    for (const [sessionId, sessionUser] of this.sessions) {
      if (sessionUser.id === user.id) {
        this.sessions.set(sessionId, user);
        break;
      }
    }
  }

  // Role-based authorization middleware
  requireRole(roles: string | string[]) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          }
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Role '${req.user.role}' is not authorized. Required roles: ${allowedRoles.join(', ')}`,
          }
        });
      }

      next();
    };
  }

  // Permission-based authorization middleware
  requirePermissions(permissions: string | string[]) {
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          }
        });
      }

      const hasPermissions = requiredPermissions.every(permission => 
        req.user.permissions.includes(permission) || req.user.role === 'admin'
      );

      if (!hasPermissions) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Missing required permissions: ${requiredPermissions.join(', ')}`,
          }
        });
      }

      next();
    };
  }

  // CSRF protection middleware
  csrfProtection() {
    return (req: any, res: any, next: any) => {
      if (!this.config.enableCsrf) {
        return next();
      }

      // Skip CSRF for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Check CSRF token
      const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
      const sessionToken = req.session?.csrfToken;

      if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        return res.status(403).json({
          error: {
            code: 'CSRF_TOKEN_INVALID',
            message: 'CSRF token is invalid or missing',
          }
        });
      }

      next();
    };
  }

  // Session management
  createSession(user: AuthUser): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check max sessions
    const userSessions = Array.from(this.sessions.entries())
      .filter(([_, sessionUser]) => sessionUser.id === user.id);

    if (userSessions.length >= this.config.maxSessions) {
      // Remove oldest session
      const oldestSession = userSessions.sort((a, b) => 
        a[1].createdAt.getTime() - b[1].createdAt.getTime()
      )[0];
      this.sessions.delete(oldestSession[0]);
    }

    this.sessions.set(sessionId, user);
    return sessionId;
  }

  destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getSession(sessionId: string): AuthUser | undefined {
    return this.sessions.get(sessionId);
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

  // Token generation
  async generateTokens(user: AuthUser): Promise<AuthResult> {
    const jwt = await import('jsonwebtoken');

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      sessionId: user.sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.config.tokenExpiration,
    };

    const token = jwt.sign(payload, this.config.secretKey);
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId: user.sessionId },
      this.config.secretKey,
      { expiresIn: this.config.refreshTokenExpiration }
    );

    return {
      user,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + this.config.tokenExpiration * 1000),
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

  // Get authentication statistics
  getStats(): {
    activeSessions: number;
    config: AuthConfig;
    uptime: number;
  } {
    return {
      activeSessions: this.sessions.size,
      config: this.getConfig(),
      uptime: Date.now(),
    };
  }
}

// JWT utilities
export class JwtUtils {
  static async generateToken(payload: any, secret: string, expiresIn: number): Promise<string> {
    const jwt = await import('jsonwebtoken');
    return jwt.sign(payload, secret, { expiresIn });
  }

  static async verifyToken(token: string, secret: string): Promise<any> {
    const jwt = await import('jsonwebtoken');
    return jwt.verify(token, secret);
  }

  static async decodeToken(token: string): Promise<any> {
    const jwt = await import('jsonwebtoken');
    return jwt.decode(token);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JWTUtil.verify(token, defaultAuthConfig.secretKey) as JwtPayload;
      return payload.exp && payload.exp < Date.now() / 1000;
    } catch {
      return true;
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

  static hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    return bcrypt.hash(password, 10);
  }

  static verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  }

  static generateApiKey(): string {
    return `api_${Math.random().toString(36).substr(2, 32)}_${Date.now().toString(36)}`;
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

  static getClientIp(req: any): string {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  static getUserFingerprint(req: any): string {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    const crypto = require('crypto');
    return crypto
      .createHash('md5')
      .update(`${userAgent}|${acceptLanguage}|${acceptEncoding}`)
      .digest('hex');
  }
}

// Predefined authentication configurations
export const authConfigs = {
  development: {
    secretKey: 'dev-secret-key',
    tokenExpiration: 3600,
    sessionTimeout: 1800,
    requireHttps: false,
    enableCsrf: false,
    enableRateLimit: false,
  },

  staging: {
    secretKey: process.env.JWT_SECRET || 'staging-secret-key',
    tokenExpiration: 3600,
    sessionTimeout: 1800,
    requireHttps: true,
    enableCsrf: true,
    enableRateLimit: true,
  },

  production: {
    secretKey: process.env.JWT_SECRET || 'production-secret-key',
    tokenExpiration: 1800, // 30 minutes
    sessionTimeout: 900, // 15 minutes
    requireHttps: true,
    enableCsrf: true,
    enableRateLimit: true,
  },
};

// Export utilities and instances
export const authMiddleware = new AuthMiddleware();
export const jwtUtils = JwtUtils;
export const authUtils = AuthUtils;

// Default export
export default AuthMiddleware;