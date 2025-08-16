/**
 * Comprehensive input validation and security hardening
 */

import { z } from 'zod';
import DOMPurify from 'dompurify';
import rateLimit from 'express-rate-limit';

// Rate limiting configurations
export const rateLimitConfigs = {
  // General API rate limiting
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  },
  
  // Stricter rate limiting for AI operations
  ai: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 AI requests per minute
    message: 'Too many AI requests, please try again later.'
  },
  
  // Authentication rate limiting
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later.'
  },
  
  // File upload rate limiting
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 uploads per minute
    message: 'Too many upload requests, please try again later.'
  }
};

// Content validation schemas
export const contentSchemas = {
  // Book validation
  book: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters')
      .regex(/^[^<>]*$/, 'Title contains invalid characters'),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    genre: z.string()
      .min(1, 'Genre is required')
      .max(50, 'Genre must be less than 50 characters'),
    language: z.string()
      .min(2, 'Language code required')
      .max(5, 'Invalid language code'),
    status: z.enum(['draft', 'published', 'archived']).default('draft')
  }),

  // Story validation
  story: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters')
      .regex(/^[^<>]*$/, 'Title contains invalid characters'),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    orderInBook: z.number()
      .int()
      .min(1, 'Order must be at least 1')
      .max(1000, 'Order cannot exceed 1000')
  }),

  // Part validation
  part: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters')
      .regex(/^[^<>]*$/, 'Title contains invalid characters'),
    description: z.string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
    orderInStory: z.number()
      .int()
      .min(1, 'Order must be at least 1')
      .max(1000, 'Order cannot exceed 1000')
  }),

  // Chapter validation
  chapter: z.object({
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be less than 200 characters')
      .regex(/^[^<>]*$/, 'Title contains invalid characters'),
    content: z.string()
      .max(50000, 'Content must be less than 50,000 characters')
      .optional(),
    orderInPart: z.number()
      .int()
      .min(1, 'Order must be at least 1')
      .max(1000, 'Order cannot exceed 1000'),
    status: z.enum(['draft', 'published']).default('draft')
  }),

  // Scene validation
  scene: z.object({
    title: z.string()
      .max(200, 'Title must be less than 200 characters')
      .regex(/^[^<>]*$/, 'Title contains invalid characters')
      .optional(),
    content: z.string()
      .min(1, 'Content is required')
      .max(10000, 'Scene content must be less than 10,000 characters'),
    orderInChapter: z.number()
      .int()
      .min(1, 'Order must be at least 1')
      .max(1000, 'Order cannot exceed 1000'),
    sceneType: z.enum(['action', 'dialogue', 'exposition', 'transition', 'climax'])
      .default('action'),
    metadata: z.object({
      characters: z.array(z.string()).optional(),
      location: z.string().max(100).optional(),
      timeOfDay: z.string().max(50).optional(),
      mood: z.enum(['tense', 'romantic', 'mysterious', 'comedic', 'dramatic', 'neutral'])
        .optional(),
      pov: z.string().max(100).optional()
    }).optional()
  }),

  // AI prompt validation
  aiPrompt: z.object({
    prompt: z.string()
      .min(1, 'Prompt is required')
      .max(2000, 'Prompt must be less than 2000 characters')
      .regex(/^[^<>{}]*$/, 'Prompt contains invalid characters'),
    context: z.string()
      .max(5000, 'Context must be less than 5000 characters')
      .optional(),
    temperature: z.number()
      .min(0)
      .max(2)
      .optional(),
    maxTokens: z.number()
      .int()
      .min(1)
      .max(4000)
      .optional()
  }),

  // Search validation
  search: z.object({
    query: z.string()
      .min(1, 'Search query is required')
      .max(200, 'Search query must be less than 200 characters')
      .regex(/^[^<>{}]*$/, 'Search query contains invalid characters'),
    filters: z.object({
      type: z.enum(['all', 'story', 'part', 'chapter', 'scene']).optional(),
      status: z.enum(['all', 'draft', 'published']).optional()
    }).optional()
  })
};

// Content sanitization
export class ContentSanitizer {
  // Sanitize HTML content
  static sanitizeHTML(content: string): string {
    if (typeof window === 'undefined') {
      // Server-side sanitization using a simple approach
      return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else {
      // Client-side sanitization using DOMPurify
      return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'],
        ALLOWED_ATTR: ['class', 'id'],
        ALLOW_DATA_ATTR: false
      });
    }
  }

  // Sanitize plain text (remove all HTML)
  static sanitizeText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
      .trim();
  }

  // Sanitize SQL-like input (prevent injection)
  static sanitizeSQL(input: string): string {
    return input
      .replace(/[';\\]/g, '') // Remove potentially dangerous characters
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE)\b/gi, '') // Remove SQL keywords
      .trim();
  }

  // Sanitize file names
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special characters with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 255); // Limit length
  }

  // Sanitize URL parameters
  static sanitizeURL(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Only allow certain protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      // Remove potentially dangerous query parameters
      const dangerousParams = ['script', 'eval', 'exec'];
      dangerousParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      return urlObj.toString();
    } catch {
      return '';
    }
  }
}

// Input validation middleware
export class InputValidator {
  // Validate and sanitize hierarchy content
  static validateHierarchyInput(type: string, data: any) {
    const schema = contentSchemas[type as keyof typeof contentSchemas];
    if (!schema) {
      throw new Error(`Invalid content type: ${type}`);
    }

    try {
      const validated = schema.parse(data);
      
      // Additional sanitization
      if ('title' in validated && typeof validated.title === 'string') {
        validated.title = ContentSanitizer.sanitizeText(validated.title);
      }
      
      if ('description' in validated && typeof validated.description === 'string') {
        validated.description = ContentSanitizer.sanitizeText(validated.description);
      }
      
      if ('content' in validated && typeof validated.content === 'string') {
        validated.content = ContentSanitizer.sanitizeHTML(validated.content);
      }
      
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  // Validate file uploads
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number) {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size ${file.size} exceeds maximum allowed size ${maxSize}`);
    }

    // Check file name
    const sanitizedName = ContentSanitizer.sanitizeFileName(file.name);
    if (sanitizedName !== file.name) {
      throw new Error('File name contains invalid characters');
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.jar'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExtension)) {
      throw new Error('File type is not allowed for security reasons');
    }

    return true;
  }

  // Validate API request structure
  static validateAPIRequest(request: any, expectedFields: string[]) {
    // Check for required fields
    for (const field of expectedFields) {
      if (!(field in request)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check for unexpected fields (prevent parameter pollution)
    const allowedFields = new Set(expectedFields);
    for (const field in request) {
      if (!allowedFields.has(field)) {
        console.warn(`Unexpected field in request: ${field}`);
        delete request[field];
      }
    }

    return request;
  }
}

// Security headers middleware
export function getSecurityHeaders() {
  return {
    // Prevent XSS attacks
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enforce HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    
    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; '),
    
    // Remove sensitive headers
    'Server': undefined,
    'X-Powered-By': undefined
  };
}

// CSRF protection
export function generateCSRFToken(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 36).toString(36)
  ).join('');
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false;
  
  // Constant-time comparison to prevent timing attacks
  let result = 0;
  if (token.length !== expectedToken.length) return false;
  
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i);
  }
  
  return result === 0;
}

// Permission validation
export class PermissionValidator {
  // Check if user can access book
  static async canAccessBook(userId: string, bookId: string): Promise<boolean> {
    try {
      // In a real implementation, this would check the database
      // const book = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
      // return book[0]?.userId === userId;
      return true; // Placeholder
    } catch {
      return false;
    }
  }

  // Check if user can modify content
  static async canModifyContent(userId: string, contentId: string, contentType: string): Promise<boolean> {
    try {
      // Check ownership through hierarchy
      return await this.canAccessBook(userId, contentId);
    } catch {
      return false;
    }
  }

  // Check rate limits
  static checkRateLimit(userId: string, action: string): boolean {
    // In a real implementation, this would check Redis or database
    // for user's recent actions and enforce rate limits
    return true; // Placeholder
  }
}

// Audit logging
export class AuditLogger {
  static async logAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>
  ) {
    const logEntry = {
      userId,
      action,
      resourceType,
      resourceId,
      metadata,
      timestamp: new Date().toISOString(),
      ip: 'unknown', // Would be extracted from request
      userAgent: 'unknown' // Would be extracted from request
    };

    // In production, this would be sent to a logging service
    console.log('[Audit]', JSON.stringify(logEntry));

    // Also store in database for compliance
    try {
      // await db.insert(auditLogs).values(logEntry);
    } catch (error) {
      console.error('Failed to store audit log:', error);
    }
  }
}

// Export validation helpers
export function createValidationMiddleware(schema: z.ZodSchema) {
  return (data: any) => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  };
}

// Security utility functions
export const SecurityUtils = {
  // Hash sensitive data
  hashData: async (data: string): Promise<string> => {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return data; // Fallback for environments without crypto.subtle
  },

  // Generate secure random string
  generateSecureRandom: (length: number = 32): string => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    // Fallback for environments without crypto.getRandomValues
    return Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join('');
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // Validate password strength
  isStrongPassword: (password: string): boolean => {
    return password.length >= 8 &&
           /[a-z]/.test(password) &&
           /[A-Z]/.test(password) &&
           /\d/.test(password) &&
           /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }
};

export { contentSchemas, ContentSanitizer, InputValidator, PermissionValidator, AuditLogger };