import { logger } from '@/lib/logging';
import { SecurityError } from '@/lib/errors';

// CORS configuration
export interface CorsConfig {
  allowedOrigins: string[] | '*';
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
  whitelist: string[];
  blacklist: string[];
  dynamicOrigin: boolean;
  originValidator?: (origin: string) => boolean | Promise<boolean>;
}

// Default CORS configuration
export const defaultCorsConfig: CorsConfig = {
  allowedOrigins: ['http://localhost:5173', 'http://localhost:3000'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Client-Version',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
  whitelist: [],
  blacklist: [],
  dynamicOrigin: false,
};

// CORS middleware class
export class CorsMiddleware {
  private config: CorsConfig;

  constructor(config: Partial<CorsConfig> = {}) {
    this.config = { ...defaultCorsConfig, ...config };
  }

  // Main CORS middleware function
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const origin = req.headers.origin;
        const method = req.method;

        // Handle preflight requests
        if (method === 'OPTIONS') {
          return await this.handlePreflight(req, res);
        }

        // Set CORS headers for actual requests
        await this.setCorsHeaders(req, res);

        next();
      } catch (error) {
        logger.error('CORS middleware error', { error, origin: req.headers.origin });
        next(error);
      }
    };
  }

  private async handlePreflight(req: any, res: any): Promise<void> {
    const origin = req.headers.origin;

    // Check if origin is allowed
    if (!await this.isOriginAllowed(origin)) {
      logger.warn('CORS preflight rejected', { origin, method: req.method });
      res.status(403).json({
        error: 'Origin not allowed',
        code: 'ORIGIN_NOT_ALLOWED',
      });
      return;
    }

    // Set preflight headers
    res.setHeader('Access-Control-Allow-Origin', this.getAllowedOrigin(origin));
    res.setHeader('Access-Control-Allow-Methods', this.config.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', this.config.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Max-Age', this.config.maxAge.toString());

    if (this.config.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (this.config.exposedHeaders.length > 0) {
      res.setHeader('Access-Control-Expose-Headers', this.config.exposedHeaders.join(', '));
    }

    res.status(this.config.optionsSuccessStatus).end();
  }

  private async setCorsHeaders(req: any, res: any): Promise<void> {
    const origin = req.headers.origin;

    if (await this.isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', this.getAllowedOrigin(origin));
      
      if (this.config.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (this.config.exposedHeaders.length > 0) {
        res.setHeader('Access-Control-Expose-Headers', this.config.exposedHeaders.join(', '));
      }
    }
  }

  private async isOriginAllowed(origin: string): Promise<boolean> {
    // Check blacklist first
    if (this.isBlacklisted(origin)) {
      return false;
    }

    // Check whitelist
    if (this.isWhitelisted(origin)) {
      return true;
    }

    // Check allowed origins
    if (this.config.allowedOrigins === '*') {
      return true;
    }

    if (Array.isArray(this.config.allowedOrigins)) {
      return this.config.allowedOrigins.includes(origin);
    }

    // Use custom validator if available
    if (this.config.originValidator) {
      return await this.config.originValidator(origin);
    }

    return false;
  }

  private getAllowedOrigin(origin: string): string {
    if (this.config.allowedOrigins === '*') {
      return '*';
    }

    if (Array.isArray(this.config.allowedOrigins)) {
      return this.config.allowedOrigins.includes(origin) ? origin : '';
    }

    return origin;
  }

  private isWhitelisted(origin: string): boolean {
    return this.config.whitelist.includes(origin);
  }

  private isBlacklisted(origin: string): boolean {
    return this.config.blacklist.includes(origin);
  }

  // Update CORS configuration
  updateConfig(config: Partial<CorsConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('CORS configuration updated', { config: this.config });
  }

  // Get current configuration
  getConfig(): CorsConfig {
    return { ...this.config };
  }

  // Add origin to whitelist
  addToWhitelist(origin: string): void {
    if (!this.config.whitelist.includes(origin)) {
      this.config.whitelist.push(origin);
      logger.info('Origin added to CORS whitelist', { origin });
    }
  }

  // Remove origin from whitelist
  removeFromWhitelist(origin: string): boolean {
    const index = this.config.whitelist.indexOf(origin);
    if (index > -1) {
      this.config.whitelist.splice(index, 1);
      logger.info('Origin removed from CORS whitelist', { origin });
      return true;
    }
    return false;
  }

  // Add origin to blacklist
  addToBlacklist(origin: string): void {
    if (!this.config.blacklist.includes(origin)) {
      this.config.blacklist.push(origin);
      logger.info('Origin added to CORS blacklist', { origin });
    }
  }

  // Remove origin from blacklist
  removeFromBlacklist(origin: string): boolean {
    const index = this.config.blacklist.indexOf(origin);
    if (index > -1) {
      this.config.blacklist.splice(index, 1);
      logger.info('Origin removed from CORS blacklist', { origin });
      return true;
    }
    return false;
  }
}

// Environment-based CORS configuration
export class EnvironmentCorsConfig {
  static getDevelopmentConfig(): Partial<CorsConfig> {
    return {
      allowedOrigins: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
      credentials: true,
      maxAge: 3600, // 1 hour for development
    };
  }

  static getStagingConfig(): Partial<CorsConfig> {
    return {
      allowedOrigins: [
        'https://staging.newomen.com',
        'https://staging-app.newomen.com',
        'https://*.vercel.app',
      ],
      credentials: true,
      maxAge: 7200, // 2 hours for staging
    };
  }

  static getProductionConfig(): Partial<CorsConfig> {
    return {
      allowedOrigins: [
        'https://newomen.com',
        'https://www.newomen.com',
        'https://app.newomen.com',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours for production
    };
  }

  static getConfigForEnvironment(env: string): Partial<CorsConfig> {
    switch (env.toLowerCase()) {
      case 'development':
      case 'dev':
        return this.getDevelopmentConfig();
      case 'staging':
      case 'stage':
        return this.getStagingConfig();
      case 'production':
      case 'prod':
        return this.getProductionConfig();
      default:
        return this.getDevelopmentConfig();
    }
  }
}

// Dynamic CORS origin validator
export class DynamicOriginValidator {
  private patterns: RegExp[] = [];

  constructor(patterns: string[]) {
    this.patterns = patterns.map(pattern => new RegExp(pattern));
  }

  validate(origin: string): boolean {
    // Check against patterns
    for (const pattern of this.patterns) {
      if (pattern.test(origin)) {
        return true;
      }
    }

    return false;
  }

  addPattern(pattern: string): void {
    this.patterns.push(new RegExp(pattern));
  }

  removePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    this.patterns = this.patterns.filter(p => p.source !== regex.source);
  }

  getPatterns(): string[] {
    return this.patterns.map(p => p.source);
  }
}

// CORS utilities
export class CorsUtils {
  static isValidOrigin(origin: string): boolean {
    if (!origin) return false;
    
    try {
      const url = new URL(origin);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  static normalizeOrigin(origin: string): string {
    if (!origin) return '';
    
    try {
      const url = new URL(origin);
      return url.origin;
    } catch {
      return origin;
    }
  }

  static getDomainFromOrigin(origin: string): string {
    if (!origin) return '';
    
    try {
      const url = new URL(origin);
      return url.hostname;
    } catch {
      return origin;
    }
  }

  static isLocalhost(origin: string): boolean {
    const domain = this.getDomainFromOrigin(origin);
    return domain === 'localhost' || domain === '127.0.0.1';
  }

  static isSecureOrigin(origin: string): boolean {
    if (!origin) return false;
    
    try {
      const url = new URL(origin);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  static generateCorsHeaders(config: CorsConfig, origin?: string): Record<string, string> {
    const headers: Record<string, string> = {};

    if (origin && config.allowedOrigins === '*') {
      headers['Access-Control-Allow-Origin'] = '*';
    } else if (origin && Array.isArray(config.allowedOrigins) && config.allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }

    if (config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (config.exposedHeaders.length > 0) {
      headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
    }

    return headers;
  }

  static parseOriginList(origins: string): string[] {
    return origins.split(',').map(origin => origin.trim()).filter(Boolean);
  }

  static validateCorsConfig(config: Partial<CorsConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.allowedOrigins && config.allowedOrigins !== '*') {
      if (!Array.isArray(config.allowedOrigins)) {
        errors.push('allowedOrigins must be an array or "*"');
      } else {
        for (const origin of config.allowedOrigins) {
          if (!this.isValidOrigin(origin)) {
            errors.push(`Invalid origin: ${origin}`);
          }
        }
      }
    }

    if (config.allowedMethods && !Array.isArray(config.allowedMethods)) {
      errors.push('allowedMethods must be an array');
    }

    if (config.allowedHeaders && !Array.isArray(config.allowedHeaders)) {
      errors.push('allowedHeaders must be an array');
    }

    if (config.maxAge && (typeof config.maxAge !== 'number' || config.maxAge < 0)) {
      errors.push('maxAge must be a non-negative number');
    }

    if (config.optionsSuccessStatus && typeof config.optionsSuccessStatus !== 'number') {
      errors.push('optionsSuccessStatus must be a number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Predefined CORS configurations for common scenarios
export const corsConfigs = {
  // Permissive configuration for development
  permissive: new CorsMiddleware({
    allowedOrigins: '*',
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['*'],
    credentials: false,
    maxAge: 3600,
  }),

  // Restrictive configuration for production
  restrictive: new CorsMiddleware({
    allowedOrigins: [],
    allowedMethods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  }),

  // API configuration for REST APIs
  api: new CorsMiddleware({
    allowedOrigins: '*',
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    credentials: false,
    maxAge: 86400,
  }),

  // WebSocket configuration
  websocket: new CorsMiddleware({
    allowedOrigins: '*',
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Sec-WebSocket-Key',
      'Sec-WebSocket-Version',
      'Sec-WebSocket-Extensions',
    ],
    credentials: true,
    maxAge: 3600,
  }),

  // GraphQL configuration
  graphql: new CorsMiddleware({
    allowedOrigins: '*',
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-GraphQL-Operation',
    ],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400,
  }),

  // File upload configuration
  fileUpload: new CorsMiddleware({
    allowedOrigins: '*',
    allowedMethods: ['POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Upload-ID',
      'X-Chunk-Index',
      'X-Total-Chunks',
    ],
    credentials: true,
    maxAge: 3600,
  }),
};

// Security-focused CORS configuration
export class SecureCorsConfig {
  static create(config: Partial<CorsConfig> = {}): CorsMiddleware {
    const secureConfig: CorsConfig = {
      ...defaultCorsConfig,
      allowedOrigins: config.allowedOrigins || [],
      allowedMethods: config.allowedMethods || ['GET', 'POST'],
      allowedHeaders: config.allowedHeaders || ['Content-Type', 'Authorization'],
      exposedHeaders: config.exposedHeaders || [],
      credentials: config.credentials ?? true,
      maxAge: config.maxAge || 3600,
      whitelist: config.whitelist || [],
      blacklist: config.blacklist || [],
      dynamicOrigin: config.dynamicOrigin || false,
      ...config,
    };

    return new CorsMiddleware(secureConfig);
  }

  static forAPI(apiName: string, allowedOrigins: string[] = []): CorsMiddleware {
    return new CorsMiddleware({
      allowedOrigins,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        `X-${apiName}-Version`,
        'X-Request-ID',
        'X-Client-ID',
      ],
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Total-Count',
        'X-Page-Count',
        `X-${apiName}-Version`,
      ],
      credentials: true,
      maxAge: 86400,
    });
  }

  static forAdmin(allowedOrigins: string[] = []): CorsMiddleware {
    return new CorsMiddleware({
      allowedOrigins,
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Admin-Token',
        'X-Request-ID',
        'X-CSRF-Token',
      ],
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Admin-Version',
      ],
      credentials: true,
      maxAge: 3600,
    });
  }

  static forPublicAPI(): CorsMiddleware {
    return new CorsMiddleware({
      allowedOrigins: '*',
      allowedMethods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'X-API-Key'],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      credentials: false,
      maxAge: 86400,
    });
  }
}

// CORS configuration for different environments
export const environmentCorsConfigs = {
  development: EnvironmentCorsConfig.getDevelopmentConfig(),
  staging: EnvironmentCorsConfig.getStagingConfig(),
  production: EnvironmentCorsConfig.getProductionConfig(),
};

// Export utilities and configurations
export const corsMiddleware = CorsMiddleware;
export const corsUtils = CorsUtils;
export const environmentCorsConfig = EnvironmentCorsConfig;
export const secureCorsConfig = SecureCorsConfig;
export const dynamicOriginValidator = DynamicOriginValidator;

// Common CORS middleware instances
export const permissiveCors = corsConfigs.permissive;
export const restrictiveCors = corsConfigs.restrictive;
export const apiCors = corsConfigs.api;
export const websocketCors = corsConfigs.websocket;
export const graphqlCors = corsConfigs.graphql;
export const fileUploadCors = corsConfigs.fileUpload;

// Default export
export default CorsMiddleware;