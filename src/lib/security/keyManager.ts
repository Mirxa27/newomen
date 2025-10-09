import { randomBytes, createCipheriv, createDecipheriv, createHash, createHmac } from 'crypto';
import { logger } from '@/lib/logging';

// Key management configuration
export interface KeyManagerConfig {
  masterKey?: string;
  keyRotationInterval?: number; // milliseconds
  keyStoragePrefix?: string;
  enableKeyRotation?: boolean;
  enableAuditLogging?: boolean;
  keyDerivationIterations?: number;
}

// Key metadata
export interface KeyMetadata {
  id: string;
  type: 'encryption' | 'signing' | 'api' | 'jwt';
  algorithm: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  usage: string;
  rotationCount: number;
}

// Encrypted key data
export interface EncryptedKey {
  id: string;
  encryptedData: string;
  iv: string;
  algorithm: string;
  keyMetadata: KeyMetadata;
}

// API key configuration
export interface APIKeyConfig {
  service: string;
  environment: string;
  permissions: string[];
  expiresAt?: Date;
  maxUsage?: number;
  currentUsage?: number;
  isRevoked?: boolean;
}

export class KeyManager {
  private static instance: KeyManager;
  private config: Required<KeyManagerConfig>;
  private keyCache = new Map<string, string>();
  private keyMetadata = new Map<string, KeyMetadata>();
  private rotationTimers = new Map<string, NodeJS.Timeout>();

  private constructor(config: KeyManagerConfig = {}) {
    this.config = {
      masterKey: config.masterKey || this.generateMasterKey(),
      keyRotationInterval: config.keyRotationInterval || 24 * 60 * 60 * 1000, // 24 hours
      keyStoragePrefix: config.keyStoragePrefix || 'newme_key_',
      enableKeyRotation: config.enableKeyRotation ?? true,
      enableAuditLogging: config.enableAuditLogging ?? true,
      keyDerivationIterations: config.keyDerivationIterations || 100000,
    };

    this.initializeKeyRotation();
  }

  static getInstance(config?: KeyManagerConfig): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager(config);
    }
    return KeyManager.instance;
  }

  private generateMasterKey(): string {
    // In production, this should be loaded from a secure vault
    const masterKey = process.env.MASTER_ENCRYPTION_KEY || randomBytes(32).toString('hex');
    if (this.config.enableAuditLogging) {
      logger.info('Generated new master key', { keyId: this.deriveKeyId(masterKey) });
    }
    return masterKey;
  }

  private deriveKeyId(key: string): string {
    return createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  private initializeKeyRotation(): void {
    if (!this.config.enableKeyRotation) return;

    // Set up periodic key rotation
    setInterval(() => {
      this.rotateExpiredKeys();
    }, this.config.keyRotationInterval);
  }

  // Generate a new encryption key
  generateKey(type: KeyMetadata['type'], algorithm: string = 'aes-256-gcm'): string {
    let key: string;
    
    switch (algorithm) {
      case 'aes-256-gcm':
        key = randomBytes(32).toString('hex');
        break;
      case 'aes-192-gcm':
        key = randomBytes(24).toString('hex');
        break;
      case 'aes-128-gcm':
        key = randomBytes(16).toString('hex');
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    const keyId = this.deriveKeyId(key);
    const metadata: KeyMetadata = {
      id: keyId,
      type,
      algorithm,
      createdAt: new Date(),
      isActive: true,
      usage: 'encryption',
      rotationCount: 0,
    };

    this.keyCache.set(keyId, key);
    this.keyMetadata.set(keyId, metadata);

    if (this.config.enableAuditLogging) {
      logger.info('Generated new key', { keyId, type, algorithm });
    }

    return keyId;
  }

  // Generate a new API key
  generateAPIKey(config: APIKeyConfig): { key: string; keyId: string } {
    const keyId = randomBytes(16).toString('hex');
    const secret = randomBytes(32).toString('hex');
    const key = `nk_${keyId}_${secret}`;

    const metadata: KeyMetadata = {
      id: keyId,
      type: 'api',
      algorithm: 'hmac-sha256',
      createdAt: new Date(),
      expiresAt: config.expiresAt,
      isActive: true,
      usage: config.service,
      rotationCount: 0,
    };

    this.keyCache.set(keyId, secret);
    this.keyMetadata.set(keyId, metadata);

    if (this.config.enableAuditLogging) {
      logger.info('Generated new API key', { 
        keyId, 
        service: config.service, 
        environment: config.environment,
        permissions: config.permissions,
      });
    }

    return { key, keyId };
  }

  // Encrypt sensitive data
  encrypt(data: string, keyId?: string): { encrypted: string; keyId: string; iv: string } {
    const encryptionKeyId = keyId || this.getActiveKey('encryption')?.id;
    if (!encryptionKeyId) {
      throw new Error('No active encryption key found');
    }

    const key = this.getKey(encryptionKeyId);
    if (!key) {
      throw new Error(`Key not found: ${encryptionKeyId}`);
    }

    const iv = randomBytes(16).toString('hex');
    const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');

    const result = {
      encrypted: `${encrypted}:${authTag}`,
      keyId: encryptionKeyId,
      iv,
    };

    if (this.config.enableAuditLogging) {
      logger.debug('Data encrypted', { keyId: encryptionKeyId, dataLength: data.length });
    }

    return result;
  }

  // Decrypt sensitive data
  decrypt(encryptedData: string, iv: string, keyId: string): string {
    const key = this.getKey(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    const [encrypted, authTag] = encryptedData.split(':');
    const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    if (this.config.enableAuditLogging) {
      logger.debug('Data decrypted', { keyId, encryptedLength: encryptedData.length });
    }

    return decrypted;
  }

  // Sign data with HMAC
  sign(data: string, keyId?: string): string {
    const signingKeyId = keyId || this.getActiveKey('signing')?.id;
    if (!signingKeyId) {
      throw new Error('No active signing key found');
    }

    const key = this.getKey(signingKeyId);
    if (!key) {
      throw new Error(`Key not found: ${signingKeyId}`);
    }

    const hmac = createHmac('sha256', key);
    hmac.update(data);
    const signature = hmac.digest('hex');

    if (this.config.enableAuditLogging) {
      logger.debug('Data signed', { keyId: signingKeyId, dataLength: data.length });
    }

    return signature;
  }

  // Verify HMAC signature
  verify(data: string, signature: string, keyId: string): boolean {
    const expectedSignature = this.sign(data, keyId);
    return this.timingSafeEqual(signature, expectedSignature);
  }

  // Timing-safe string comparison
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  // Get a key from cache or storage
  private getKey(keyId: string): string | undefined {
    // Check cache first
    const cachedKey = this.keyCache.get(keyId);
    if (cachedKey) return cachedKey;

    // In a real implementation, this would fetch from secure storage
    // For now, we'll assume keys are only in cache
    return undefined;
  }

  // Get active key of a specific type
  getActiveKey(type: KeyMetadata['type']): KeyMetadata | undefined {
    for (const [keyId, metadata] of this.keyMetadata) {
      if (metadata.type === type && metadata.isActive) {
        if (!metadata.expiresAt || metadata.expiresAt > new Date()) {
          return metadata;
        }
      }
    }
    return undefined;
  }

  // Rotate expired keys
  private rotateExpiredKeys(): void {
    const now = new Date();
    
    for (const [keyId, metadata] of this.keyMetadata) {
      if (metadata.expiresAt && metadata.expiresAt <= now && metadata.isActive) {
        this.rotateKey(keyId);
      }
    }
  }

  // Rotate a specific key
  rotateKey(keyId: string): void {
    const metadata = this.keyMetadata.get(keyId);
    if (!metadata) {
      throw new Error(`Key metadata not found: ${keyId}`);
    }

    // Generate new key
    const newKeyId = this.generateKey(metadata.type, metadata.algorithm);
    const newMetadata = this.keyMetadata.get(newKeyId)!;
    
    // Copy metadata and update
    newMetadata.usage = metadata.usage;
    newMetadata.rotationCount = metadata.rotationCount + 1;

    // Deactivate old key
    metadata.isActive = false;

    if (this.config.enableAuditLogging) {
      logger.info('Key rotated', { 
        oldKeyId: keyId, 
        newKeyId, 
        type: metadata.type,
        rotationCount: newMetadata.rotationCount,
      });
    }
  }

  // Revoke a key
  revokeKey(keyId: string, reason?: string): void {
    const metadata = this.keyMetadata.get(keyId);
    if (!metadata) {
      throw new Error(`Key metadata not found: ${keyId}`);
    }

    metadata.isActive = false;
    this.keyCache.delete(keyId);

    if (this.config.enableAuditLogging) {
      logger.warn('Key revoked', { keyId, reason, type: metadata.type });
    }
  }

  // Validate API key
  validateAPIKey(key: string, service?: string): { valid: boolean; keyId?: string; permissions?: string[] } {
    try {
      const parts = key.split('_');
      if (parts.length !== 3 || parts[0] !== 'nk') {
        return { valid: false };
      }

      const keyId = parts[1];
      const secret = parts[2];

      const metadata = this.keyMetadata.get(keyId);
      if (!metadata || !metadata.isActive) {
        return { valid: false };
      }

      if (metadata.expiresAt && metadata.expiresAt <= new Date()) {
        return { valid: false };
      }

      const storedSecret = this.getKey(keyId);
      if (!storedSecret || !this.timingSafeEqual(secret, storedSecret)) {
        return { valid: false };
      }

      if (service && metadata.usage !== service) {
        return { valid: false };
      }

      return { valid: true, keyId, permissions: [] }; // Permissions would be stored in metadata
    } catch (error) {
      logger.error('API key validation failed', { error });
      return { valid: false };
    }
  }

  // Get key metadata
  getKeyMetadata(keyId: string): KeyMetadata | undefined {
    return this.keyMetadata.get(keyId);
  }

  // Get all active keys
  getActiveKeys(): KeyMetadata[] {
    const activeKeys: KeyMetadata[] = [];
    const now = new Date();

    for (const metadata of this.keyMetadata.values()) {
      if (metadata.isActive && (!metadata.expiresAt || metadata.expiresAt > now)) {
        activeKeys.push(metadata);
      }
    }

    return activeKeys;
  }

  // Secure key storage (in-memory for now, should be external in production)
  private async storeKey(keyId: string, key: string): Promise<void> {
    // In production, this would store in a secure vault like AWS KMS, HashiCorp Vault, etc.
    this.keyCache.set(keyId, key);
  }

  private async retrieveKey(keyId: string): Promise<string | undefined> {
    // In production, this would retrieve from secure storage
    return this.keyCache.get(keyId);
  }

  // Cleanup expired keys
  cleanupExpiredKeys(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [keyId, metadata] of this.keyMetadata) {
      if (metadata.expiresAt && metadata.expiresAt <= now) {
        this.keyCache.delete(keyId);
        this.keyMetadata.delete(keyId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && this.config.enableAuditLogging) {
      logger.info('Cleaned up expired keys', { count: cleanedCount });
    }
  }

  // Get key statistics
  getKeyStatistics(): {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    byType: Record<string, number>;
  } {
    const stats = {
      totalKeys: this.keyMetadata.size,
      activeKeys: 0,
      expiredKeys: 0,
      byType: {} as Record<string, number>,
    };

    const now = new Date();

    for (const metadata of this.keyMetadata.values()) {
      if (metadata.isActive && (!metadata.expiresAt || metadata.expiresAt > now)) {
        stats.activeKeys++;
      } else {
        stats.expiredKeys++;
      }

      stats.byType[metadata.type] = (stats.byType[metadata.type] || 0) + 1;
    }

    return stats;
  }
}

// Secure random string generator
export function generateSecureRandom(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

// Password hashing utilities
export class PasswordHasher {
  private static readonly SALT_LENGTH = 32;
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 64;
  private static readonly ALGORITHM = 'sha256';

  static hash(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = randomBytes(this.SALT_LENGTH).toString('hex');
      
      // In a real implementation, use a proper password hashing library like bcrypt or argon2
      const hash = createHash(this.ALGORITHM)
        .update(password + salt)
        .digest('hex');

      resolve(`${salt}:${hash}`);
    });
  }

  static verify(password: string, hashed: string): Promise<boolean> {
    return new Promise((resolve) => {
      const [salt, hash] = hashed.split(':');
      
      const verifyHash = createHash(this.ALGORITHM)
        .update(password + salt)
        .digest('hex');

      resolve(hash === verifyHash);
    });
  }
}

// JWT token utilities
export class JWTUtil {
  static generate(payload: Record<string, unknown>, secret: string, expiresIn: string = '1h'): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.parseExpiresIn(expiresIn);

    const data = {
      ...payload,
      iat: now,
      exp,
    };

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedData = btoa(JSON.stringify(data));
    const signature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedData}`)
      .digest('base64');

    return `${encodedHeader}.${encodedData}.${signature}`;
  }

  static verify(token: string, secret: string): Record<string, unknown> | null {
    try {
      const [header, data, signature] = token.split('.');
      
      const expectedSignature = createHmac('sha256', secret)
        .update(`${header}.${data}`)
        .digest('base64');

      if (signature !== expectedSignature) {
        return null;
      }

      const decodedData = JSON.parse(atob(data));
      const now = Math.floor(Date.now() / 1000);

      if (decodedData.exp && decodedData.exp < now) {
        return null;
      }

      return decodedData;
    } catch (error) {
      return null;
    }
  }

  private static parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default to 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 3600;
    }
  }
}

// Export singleton instance
export const keyManager = KeyManager.getInstance();

// Security headers for HTTP responses
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  draft_polli_ratelimit?: boolean;
  store?: any;
}

export const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  message: 'Too many requests from this IP, please try again later.',
  statusCode: 429,
  headers: true,
  draft_polli_ratelimit: true,
};

// CORS configuration
export interface CORSConfig {
  origin: string | string[] | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export const defaultCORSConfig: CORSConfig = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
};

// Input validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

// Sanitization functions
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Security utilities
export const securityUtils = {
  generateSecureRandom,
  sanitizeInput,
  sanitizeHtml,
  escapeHtml,
  passwordHasher: PasswordHasher,
  jwtUtil: JWTUtil,
};