import { logger } from '@/lib/logging';
import { ValidationError } from '@/lib/errors';

// Sanitization configuration
export interface SanitizationConfig {
  allowedTags: string[];
  allowedAttributes: string[];
  allowedSchemes: string[];
  maxLength: number;
  stripUnknown: boolean;
  escapeHtml: boolean;
  removeScripts: boolean;
  removeStyles: boolean;
  allowDataAttributes: boolean;
  allowAriaAttributes: boolean;
  customSanitizers?: Record<string, (value: unknown) => unknown>;
}

// Default sanitization configuration
export const defaultSanitizationConfig: SanitizationConfig = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
  ],
  allowedAttributes: ['href', 'src', 'alt', 'title', 'class', 'id', 'style'],
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  maxLength: 10000,
  stripUnknown: true,
  escapeHtml: true,
  removeScripts: true,
  removeStyles: false,
  allowDataAttributes: false,
  allowAriaAttributes: true,
  customSanitizers: {},
};

// HTML entity mapping
const htmlEntities: Record<string, string> = {
  '&': '&',
  '<': '<',
  '>': '>',
  '"': '"',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

// XSS patterns
const xssPatterns = {
  script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  javascript: /javascript:/gi,
  data: /data:text\/html/gi,
  vbscript: /vbscript:/gi,
  onerror: /onerror\s*=/gi,
  onload: /onload\s*=/gi,
  onclick: /onclick\s*=/gi,
  onmouseover: /onmouseover\s*=/gi,
  onfocus: /onfocus\s*=/gi,
  onblur: /onblur\s*=/gi,
  onchange: /onchange\s*=/gi,
  onsubmit: /onsubmit\s*=/gi,
  style: /style\s*=\s*["'][^"']*expression[^"']*["']/gi,
  iframe: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  object: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  embed: /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  link: /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
  meta: /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
};

// Main sanitization class
export class Sanitizer {
  private config: SanitizationConfig;

  constructor(config: Partial<SanitizationConfig> = {}) {
    this.config = { ...defaultSanitizationConfig, ...config };
  }

  // Sanitize string input
  sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Apply length limit
    if (sanitized.length > this.config.maxLength) {
      sanitized = sanitized.substring(0, this.config.maxLength);
      logger.warn('Input truncated due to length limit', { 
        originalLength: input.length, 
        maxLength: this.config.maxLength 
      });
    }

    // Escape HTML if enabled
    if (this.config.escapeHtml) {
      sanitized = this.escapeHtml(sanitized);
    }

    // Remove scripts if enabled
    if (this.config.removeScripts) {
      sanitized = this.removeScripts(sanitized);
    }

    // Remove styles if enabled
    if (this.config.removeStyles) {
      sanitized = this.removeStyles(sanitized);
    }

    return sanitized.trim();
  }

  // Sanitize HTML content
  sanitizeHtml(html: string): string {
    if (typeof html !== 'string') {
      return '';
    }

    let sanitized = html;

    // Remove dangerous tags and attributes
    sanitized = this.removeDangerousTags(sanitized);
    sanitized = this.removeDangerousAttributes(sanitized);
    sanitized = this.cleanUrls(sanitized);

    // Apply allowed tags filter
    sanitized = this.filterAllowedTags(sanitized);

    return sanitized.trim();
  }

  // Sanitize URL
  sanitizeUrl(url: string): string {
    if (typeof url !== 'string') {
      return '';
    }

    const sanitized = url.trim();

    // Check against allowed schemes
    const urlObj = this.parseUrl(sanitized);
    if (urlObj && !this.isAllowedScheme(urlObj.protocol)) {
      logger.warn('URL scheme not allowed', { url: sanitized, scheme: urlObj.protocol });
      return '';
    }

    // Remove javascript: and data: URLs
    if (xssPatterns.javascript.test(sanitized) || xssPatterns.data.test(sanitized)) {
      logger.warn('Dangerous URL detected and removed', { url: sanitized });
      return '';
    }

    return sanitized;
  }

  // Sanitize email
  sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      return '';
    }

    const sanitized = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      logger.warn('Invalid email format', { email: sanitized });
      return '';
    }

    return sanitized;
  }

  // Sanitize phone number
  sanitizePhoneNumber(phone: string): string {
    if (typeof phone !== 'string') {
      return '';
    }

    const sanitized = phone.replace(/\D/g, '');

    // Basic length validation
    if (sanitized.length < 7 || sanitized.length > 15) {
      logger.warn('Invalid phone number length', { phone: sanitized, length: sanitized.length });
      return '';
    }

    return sanitized;
  }

  // Sanitize JSON input
  sanitizeJson(json: string): unknown {
    try {
      const parsed = JSON.parse(json);
      return this.sanitizeObject(parsed);
    } catch (error) {
      logger.error('Invalid JSON input', { error, json });
      throw new ValidationError('Invalid JSON format');
    }
  }

  // Sanitize object recursively
  sanitizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: { [key: string]: unknown } = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  // Escape HTML entities
  private escapeHtml(text: string): string {
    return text.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
  }

  // Remove script tags and content
  private removeScripts(text: string): string {
    return text
      .replace(xssPatterns.script, '')
      .replace(xssPatterns.javascript, '')
      .replace(xssPatterns.vbscript, '');
  }

  // Remove style attributes
  private removeStyles(text: string): string {
    return text.replace(/style\s*=\s*["'][^"']*["']/gi, '');
  }

  // Remove dangerous HTML tags
  private removeDangerousTags(html: string): string {
    let sanitized = html;

    // Remove script tags
    sanitized = sanitized.replace(xssPatterns.script, '');

    // Remove iframe tags
    sanitized = sanitized.replace(xssPatterns.iframe, '');

    // Remove object tags
    sanitized = sanitized.replace(xssPatterns.object, '');

    // Remove embed tags
    sanitized = sanitized.replace(xssPatterns.embed, '');

    // Remove link tags
    sanitized = sanitized.replace(xssPatterns.link, '');

    // Remove meta tags
    sanitized = sanitized.replace(xssPatterns.meta, '');

    return sanitized;
  }

  // Remove dangerous attributes
  private removeDangerousAttributes(html: string): string {
    let sanitized = html;

    // Remove event handler attributes
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove style with expression
    sanitized = sanitized.replace(xssPatterns.style, '');

    return sanitized;
  }

  // Clean URLs in HTML
  private cleanUrls(html: string): string {
    return html.replace(/href\s*=\s*["'][^"']*["']/gi, (match) => {
      const url = match.replace(/href\s*=\s*["']/i, '').replace(/["']$/, '');
      const sanitizedUrl = this.sanitizeUrl(url);
      return sanitizedUrl ? `href="${sanitizedUrl}"` : '';
    });
  }

  // Filter allowed HTML tags
  private filterAllowedTags(html: string): string {
    if (this.config.stripUnknown) {
      // Remove all tags not in allowedTags
      const allowedPattern = new RegExp(`<(?!\\/?(${this.config.allowedTags.join('|')})\\b)[^>]*>`, 'gi');
      return html.replace(allowedPattern, '');
    }

    return html;
  }

  // Check if scheme is allowed
  private isAllowedScheme(scheme: string): boolean {
    const cleanScheme = scheme.replace(':', '');
    return this.config.allowedSchemes.includes(cleanScheme);
  }

  // Parse URL safely
  private parseUrl(url: string): URL | null {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }

  // Update configuration
  updateConfig(config: Partial<SanitizationConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Sanitization configuration updated');
  }

  // Get current configuration
  getConfig(): SanitizationConfig {
    return { ...this.config };
  }
}

// XSS protection utilities
export class XssProtector {
  static encodeForHtml(text: string): string {
    return text.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
  }

  static encodeForAttribute(text: string): string {
    return text.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char);
  }

  static encodeForJavaScript(text: string): string {
    return JSON.stringify(text);
  }

  static encodeForCss(text: string): string {
    return text.replace(/[<>&"']/g, (char) => {
      switch (char) {
        case '<': return '\\00003c';
        case '>': return '\\00003e';
        case '&': return '\\000026';
        case '"': return '\\000022';
        case "'": return '\\000027';
        default: return char;
      }
    });
  }

  static encodeForUrl(text: string): string {
    return encodeURIComponent(text);
  }

  static stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  static removeEventHandlers(html: string): string {
    return html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  static validateInput(input: string, type: 'email' | 'url' | 'phone' | 'generic'): boolean {
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      case 'url':
        try {
          new URL(input);
          return true;
        } catch {
          return false;
        }
      case 'phone':
        return /^\+?[\d\s()-]+$/.test(input);
      default:
        return typeof input === 'string' && input.length > 0;
    }
  }

  static detectXssPatterns(input: string): { detected: boolean; patterns: string[] } {
    const detectedPatterns: string[] = [];

    for (const [name, pattern] of Object.entries(xssPatterns)) {
      if (pattern.test(input)) {
        detectedPatterns.push(name);
      }
    }

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns,
    };
  }

  static sanitizeForContext(context: 'html' | 'attribute' | 'javascript' | 'css' | 'url', input: string): string {
    switch (context) {
      case 'html':
        return this.encodeForHtml(input);
      case 'attribute':
        return this.encodeForAttribute(input);
      case 'javascript':
        return this.encodeForJavaScript(input);
      case 'css':
        return this.encodeForCss(input);
      case 'url':
        return this.encodeForUrl(input);
      default:
        return this.encodeForHtml(input);
    }
  }
}

// Input validation utilities
export class InputValidator {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s()-]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
  }

  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  }

  static isValidPassword(password: string): boolean {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  static isValidJson(json: string): boolean {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }

  static isValidHtml(html: string): boolean {
    // Basic HTML validation - check for balanced tags
    const openTags = (html.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (html.match(/<\/[^>]+>/g) || []).length;
    return openTags === closeTags;
  }

  static sanitizeLength(input: string, maxLength: number): string {
    if (input.length > maxLength) {
      return input.substring(0, maxLength);
    }
    return input;
  }

  static removeWhitespace(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
  }

  static removeSpecialChars(input: string, keepSpaces = true): string {
    const pattern = keepSpaces ? /[^a-zA-Z0-9\s]/g : /[^a-zA-Z0-9]/g;
    return input.replace(pattern, '');
  }

  static normalizeText(input: string): string {
    return input
      .normalize('NFC')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .trim();
  }
}

// Sanitization presets for common use cases
export const sanitizationPresets = {
  strict: new Sanitizer({
    allowedTags: [],
    allowedAttributes: [],
    escapeHtml: true,
    removeScripts: true,
    removeStyles: true,
    stripUnknown: true,
  }),

  moderate: new Sanitizer({
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'i', 'b'],
    allowedAttributes: [],
    escapeHtml: false,
    removeScripts: true,
    removeStyles: true,
    stripUnknown: true,
  }),

  permissive: new Sanitizer({
    allowedTags: defaultSanitizationConfig.allowedTags,
    allowedAttributes: defaultSanitizationConfig.allowedAttributes,
    escapeHtml: false,
    removeScripts: true,
    removeStyles: false,
    stripUnknown: false,
  }),

  htmlOnly: new Sanitizer({
    allowedTags: defaultSanitizationConfig.allowedTags,
    allowedAttributes: defaultSanitizationConfig.allowedAttributes,
    escapeHtml: false,
    removeScripts: true,
    removeStyles: false,
    stripUnknown: true,
  }),

  textOnly: new Sanitizer({
    allowedTags: [],
    allowedAttributes: [],
    escapeHtml: true,
    removeScripts: true,
    removeStyles: true,
    stripUnknown: true,
  }),

  url: new Sanitizer({
    allowedTags: ['a'],
    allowedAttributes: ['href'],
    allowedSchemes: ['http', 'https'],
    escapeHtml: false,
    removeScripts: true,
    removeStyles: true,
    stripUnknown: true,
  }),
};

// Export utilities and instances
export const sanitizer = new Sanitizer();
export const xssProtector = XssProtector;
export const inputValidator = InputValidator;

// Common sanitizers
export const strictSanitizer = sanitizationPresets.strict;
export const moderateSanitizer = sanitizationPresets.moderate;
export const permissiveSanitizer = sanitizationPresets.permissive;
export const htmlSanitizer = sanitizationPresets.htmlOnly;
export const textSanitizer = sanitizationPresets.textOnly;
export const urlSanitizer = sanitizationPresets.url;

// Default export
export default Sanitizer;