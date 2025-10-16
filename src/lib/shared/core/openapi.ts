import { z } from 'zod';
import { logger } from '@/lib/logging';
import { ValidationError, APIError } from '@/lib/errors';

// OpenAPI 3.0.3 specification types
export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: OpenAPIPaths;
  components?: OpenAPIComponents;
  security?: OpenAPISecurityRequirement[];
  tags?: OpenAPITag[];
  externalDocs?: OpenAPIExternalDocumentation;
}

export interface OpenAPIInfo {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: OpenAPIContact;
  license?: OpenAPILicense;
  version: string;
}

export interface OpenAPIContact {
  name?: string;
  url?: string;
  email?: string;
}

export interface OpenAPILicense {
  name: string;
  url?: string;
}

export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: Record<string, OpenAPIServerVariable>;
}

export interface OpenAPIServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface OpenAPIPaths {
  [path: string]: OpenAPIPathItem;
}

export interface OpenAPIPathItem {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: OpenAPIOperation;
  put?: OpenAPIOperation;
  post?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  options?: OpenAPIOperation;
  head?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  trace?: OpenAPIOperation;
  servers?: OpenAPIServer[];
  parameters?: OpenAPIParameter[];
}

export interface OpenAPIOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: OpenAPIExternalDocumentation;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: OpenAPIResponses;
  callbacks?: Record<string, OpenAPICallback>;
  deprecated?: boolean;
  security?: OpenAPISecurityRequirement[];
  servers?: OpenAPIServer[];
}

export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: OpenAPISchema;
  example?: unknown;
  examples?: Record<string, OpenAPIExample>;
  content?: Record<string, OpenAPIMediaType>;
}

export interface OpenAPIRequestBody {
  description?: string;
  content: Record<string, OpenAPIMediaType>;
  required?: boolean;
}

export interface OpenAPIMediaType {
  schema?: OpenAPISchema;
  example?: unknown;
  examples?: Record<string, OpenAPIExample>;
  encoding?: Record<string, OpenAPIEncoding>;
}

export interface OpenAPISchema {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  default?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  enum?: unknown[];
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  properties?: Record<string, OpenAPISchema>;
  additionalProperties?: boolean | OpenAPISchema;
  items?: OpenAPISchema;
  allOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  not?: OpenAPISchema;
  discriminator?: OpenAPIDiscriminator;
  xml?: OpenAPIXml;
  externalDocs?: OpenAPIExternalDocumentation;
  example?: unknown;
  deprecated?: boolean;
}

export interface OpenAPIResponses {
  [statusCode: string]: OpenAPIResponse;
}

export interface OpenAPIResponse {
  description: string;
  headers?: Record<string, OpenAPIHeader>;
  content?: Record<string, OpenAPIMediaType>;
  links?: Record<string, OpenAPILink>;
}

export interface OpenAPIHeader {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: OpenAPISchema;
  example?: unknown;
  examples?: Record<string, OpenAPIExample>;
  content?: Record<string, OpenAPIMediaType>;
}

export interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchema>;
  responses?: Record<string, OpenAPIResponse>;
  parameters?: Record<string, OpenAPIParameter>;
  examples?: Record<string, OpenAPIExample>;
  requestBodies?: Record<string, OpenAPIRequestBody>;
  headers?: Record<string, OpenAPIHeader>;
  securitySchemes?: Record<string, OpenAPISecurityScheme>;
  links?: Record<string, OpenAPILink>;
  callbacks?: Record<string, OpenAPICallback>;
}

export interface OpenAPISecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OpenAPIOAuthFlows;
  openIdConnectUrl?: string;
}

export interface OpenAPIOAuthFlows {
  implicit?: OpenAPIOAuthFlow;
  password?: OpenAPIOAuthFlow;
  clientCredentials?: OpenAPIOAuthFlow;
  authorizationCode?: OpenAPIOAuthFlow;
}

export interface OpenAPIOAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface OpenAPISecurityRequirement {
  [name: string]: string[];
}

export interface OpenAPITag {
  name: string;
  description?: string;
  externalDocs?: OpenAPIExternalDocumentation;
}

export interface OpenAPIExternalDocumentation {
  description?: string;
  url: string;
}

export interface OpenAPIExample {
  summary?: string;
  description?: string;
  value?: unknown;
  externalValue?: string;
}

export interface OpenAPIEncoding {
  contentType?: string;
  headers?: Record<string, OpenAPIHeader>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface OpenAPIDiscriminator {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface OpenAPIXml {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

export interface OpenAPILink {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, unknown>;
  requestBody?: unknown;
  description?: string;
  server?: OpenAPIServer;
}

export interface OpenAPICallback {
  [expression: string]: OpenAPIPathItem;
}

// Zod to OpenAPI schema converter
export class ZodToOpenAPIConverter {
  static convert(schema: z.ZodType<unknown>): OpenAPISchema {
    if (schema instanceof z.ZodString) {
      return this.convertString(schema);
    } else if (schema instanceof z.ZodNumber) {
      return this.convertNumber(schema);
    } else if (schema instanceof z.ZodBoolean) {
      return this.convertBoolean(schema);
    } else if (schema instanceof z.ZodArray) {
      return this.convertArray(schema);
    } else if (schema instanceof z.ZodObject) {
      return this.convertObject(schema);
    } else if (schema instanceof z.ZodEnum) {
      return this.convertEnum(schema);
    } else if (schema instanceof z.ZodUnion) {
      return this.convertUnion(schema);
    } else if (schema instanceof z.ZodOptional) {
      return this.convertOptional(schema);
    } else if (schema instanceof z.ZodNullable) {
      return this.convertNullable(schema);
    } else if (schema instanceof z.ZodDate) {
      return this.convertDate(schema);
    } else if (schema instanceof z.ZodEmail) {
      return this.convertEmail(schema);
    } else if (schema instanceof z.ZodUrl) {
      return this.convertUrl(schema);
    } else if (schema instanceof z.ZodUUID) {
      return this.convertUUID(schema);
    } else {
      return { type: 'object', description: 'Unknown schema type' };
    }
  }

  private static convertString(schema: z.ZodString): OpenAPISchema {
    const result: OpenAPISchema = { type: 'string' };
    
    const minLength = schema._def.checks.find(check => check.kind === 'min');
    const maxLength = schema._def.checks.find(check => check.kind === 'max');
    const regex = schema._def.checks.find(check => check.kind === 'regex');
    const email = schema._def.checks.find(check => check.kind === 'email');
    const url = schema._def.checks.find(check => check.kind === 'url');
    const uuid = schema._def.checks.find(check => check.kind === 'uuid');

    if (minLength) result.minLength = minLength.value;
    if (maxLength) result.maxLength = maxLength.value;
    if (regex) result.pattern = regex.regex.source;
    if (email) result.format = 'email';
    if (url) result.format = 'uri';
    if (uuid) result.format = 'uuid';

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertNumber(schema: z.ZodNumber): OpenAPISchema {
    const result: OpenAPISchema = { type: 'number' };
    
    const min = schema._def.checks.find(check => check.kind === 'min');
    const max = schema._def.checks.find(check => check.kind === 'max');
    const int = schema._def.checks.find(check => check.kind === 'int');

    if (min) {
      if (min.inclusive) {
        result.minimum = min.value;
      } else {
        result.exclusiveMinimum = true;
        result.minimum = min.value;
      }
    }

    if (max) {
      if (max.inclusive) {
        result.maximum = max.value;
      } else {
        result.exclusiveMaximum = true;
        result.maximum = max.value;
      }
    }

    if (int) {
      result.type = 'integer';
    }

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertBoolean(schema: z.ZodBoolean): OpenAPISchema {
    const result: OpenAPISchema = { type: 'boolean' };
    
    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertArray(schema: z.ZodArray<z.ZodType<unknown>>): OpenAPISchema {
    const result: OpenAPISchema = { 
      type: 'array',
      items: this.convert(schema._def.type)
    };

    const min = schema._def.minLength?.value;
    const max = schema._def.maxLength?.value;

    if (min !== undefined) result.minItems = min;
    if (max !== undefined) result.maxItems = max;

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertObject(
    schema: z.ZodObject<z.ZodRawShape>
  ): OpenAPISchema {
    const result: OpenAPISchema = { type: 'object' };
    const shape = schema._def.shape();
    
    result.properties = {};
    result.required = [];

    for (const [key, value] of Object.entries(shape)) {
      const propSchema = value as z.ZodType<unknown>;
      result.properties![key] = this.convert(propSchema);
      
      if (
        !(propSchema instanceof z.ZodOptional) &&
        !(propSchema instanceof z.ZodNullable)
      ) {
        result.required!.push(key);
      }
    }

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertEnum(schema: z.ZodEnum<[string, ...string[]]>): OpenAPISchema {
    const result: OpenAPISchema = { 
      type: 'string',
      enum: schema._def.values
    };

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertUnion(schema: z.ZodUnion<[z.ZodType<unknown>, ...z.ZodType<unknown>[]]>): OpenAPISchema {
    const result: OpenAPISchema = {
      oneOf: schema._def.options.map((option: z.ZodType) =>
        this.convert(option)
      ),
    };

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertOptional(schema: z.ZodOptional<z.ZodType<unknown>>): OpenAPISchema {
    const innerSchema = this.convert(schema._def.innerType);
    innerSchema.nullable = true;
    
    if (schema.description) {
      innerSchema.description = schema.description;
    }

    return innerSchema;
  }

  private static convertNullable(schema: z.ZodNullable<z.ZodType<unknown>>): OpenAPISchema {
    const innerSchema = this.convert(schema._def.innerType);
    innerSchema.nullable = true;
    
    if (schema.description) {
      innerSchema.description = schema.description;
    }

    return innerSchema;
  }

  private static convertDate(schema: z.ZodDate): OpenAPISchema {
    const result: OpenAPISchema = { 
      type: 'string',
      format: 'date-time'
    };

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertEmail(schema: z.ZodString): OpenAPISchema {
    const result: OpenAPISchema = { 
      type: 'string',
      format: 'email'
    };

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertUrl(schema: z.ZodString): OpenAPISchema {
    const result: OpenAPISchema = { 
      type: 'string',
      format: 'uri'
    };

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  private static convertUUID(schema: z.ZodString): OpenAPISchema {
    const result: OpenAPISchema = { 
      type: 'string',
      format: 'uuid'
    };

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }
}

// OpenAPI specification builder
export class OpenAPISpecBuilder {
  private spec: OpenAPISpec;

  constructor(title: string, version: string) {
    this.spec = {
      openapi: '3.0.3',
      info: {
        title,
        version
      },
      paths: {},
      components: {
        schemas: {},
        responses: {},
        parameters: {},
        securitySchemes: {}
      }
    };
  }

  setInfo(info: Partial<OpenAPIInfo>): this {
    this.spec.info = { ...this.spec.info, ...info };
    return this;
  }

  addServer(server: OpenAPIServer): this {
    if (!this.spec.servers) {
      this.spec.servers = [];
    }
    this.spec.servers.push(server);
    return this;
  }

  addPath(path: string, pathItem: OpenAPIPathItem): this {
    this.spec.paths[path] = pathItem;
    return this;
  }

  addSchema(name: string, schema: z.ZodType | OpenAPISchema): this {
    if (!this.spec.components!.schemas) {
      this.spec.components!.schemas = {};
    }

    if (schema instanceof z.ZodType) {
      this.spec.components!.schemas[name] = ZodToOpenAPIConverter.convert(schema);
    } else {
      this.spec.components!.schemas[name] = schema;
    }
    return this;
  }

  addResponse(name: string, response: OpenAPIResponse): this {
    if (!this.spec.components!.responses) {
      this.spec.components!.responses = {};
    }
    this.spec.components!.responses[name] = response;
    return this;
  }

  addParameter(name: string, parameter: OpenAPIParameter): this {
    if (!this.spec.components!.parameters) {
      this.spec.components!.parameters = {};
    }
    this.spec.components!.parameters[name] = parameter;
    return this;
  }

  addSecurityScheme(name: string, scheme: OpenAPISecurityScheme): this {
    if (!this.spec.components!.securitySchemes) {
      this.spec.components!.securitySchemes = {};
    }
    this.spec.components!.securitySchemes[name] = scheme;
    return this;
  }

  addTag(tag: OpenAPITag): this {
    if (!this.spec.tags) {
      this.spec.tags = [];
    }
    this.spec.tags.push(tag);
    return this;
  }

  setSecurity(security: OpenAPISecurityRequirement[]): this {
    this.spec.security = security;
    return this;
  }

  build(): OpenAPISpec {
    return JSON.parse(JSON.stringify(this.spec));
  }
}

// API documentation generator
export class APIDocumentationGenerator {
  private builder: OpenAPISpecBuilder;

  constructor(title: string, version: string) {
    this.builder = new OpenAPISpecBuilder(title, version);
  }

  generateWellnessAPI(): OpenAPISpec {
    // Set API info
    this.builder.setInfo({
      title: 'NewMe Wellness Platform API',
      description: 'Comprehensive wellness platform API for AI-powered assessments, real-time chat, and gamification',
      version: '1.0.0',
      contact: {
        name: 'NewMe Support',
        email: 'support@newme.com',
        url: 'https://newme.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    });

    // Add servers
    this.builder.addServer({
      url: 'https://api.newme.com',
      description: 'Production server'
    }).addServer({
      url: 'https://staging-api.newme.com',
      description: 'Staging server'
    }).addServer({
      url: 'http://localhost:5173',
      description: 'Development server'
    });

    // Add security schemes
    this.builder.addSecurityScheme('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT authentication using Supabase'
    }).addSecurityScheme('apiKey', {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      description: 'API key authentication for service-to-service communication'
    });

    // Add common schemas
    this.addCommonSchemas();
    
    // Add API endpoints
    this.addAuthEndpoints();
    this.addUserEndpoints();
    this.addAssessmentEndpoints();
    this.addChatEndpoints();
    this.addGamificationEndpoints();
    this.addCommunityEndpoints();

    // Add tags
    this.builder.addTag({
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    }).addTag({
      name: 'Users',
      description: 'User profile and management endpoints'
    }).addTag({
      name: 'Assessments',
      description: 'AI-powered wellness assessment endpoints'
    }).addTag({
      name: 'Chat',
      description: 'Real-time chat and voice communication endpoints'
    }).addTag({
      name: 'Gamification',
      description: 'Gamification and achievement endpoints'
    }).addTag({
      name: 'Community',
      description: 'Community and social features endpoints'
    });

    // Set default security
    this.builder.setSecurity([{ bearerAuth: [] }]);

    return this.builder.build();
  }

  private addCommonSchemas(): void {
    // Error response schema
    this.builder.addSchema('ErrorResponse', z.object({
      error: z.string().describe('Error message'),
      code: z.string().describe('Error code'),
      details: z.object({}).optional().describe('Additional error details'),
      timestamp: z.string().datetime().describe('Error timestamp'),
      path: z.string().optional().describe('Request path'),
      requestId: z.string().uuid().optional().describe('Request ID for tracking')
    }));

    // Pagination schema
    this.builder.addSchema('Pagination', z.object({
      page: z.number().int().min(1).default(1).describe('Current page number'),
      limit: z.number().int().min(1).max(100).default(20).describe('Items per page'),
      total: z.number().int().min(0).describe('Total number of items'),
      totalPages: z.number().int().min(0).describe('Total number of pages'),
      hasNext: z.boolean().describe('Whether there is a next page'),
      hasPrev: z.boolean().describe('Whether there is a previous page')
    }));

    // User schema
    this.builder.addSchema('User', z.object({
      id: z.string().uuid().describe('User ID'),
      email: z.string().email().describe('User email address'),
      username: z.string().min(3).max(50).describe('Username'),
      displayName: z.string().max(100).describe('Display name'),
      avatar: z.string().url().optional().describe('Avatar URL'),
      role: z.enum(['user', 'premium', 'admin']).default('user').describe('User role'),
      isActive: z.boolean().default(true).describe('Whether the user is active'),
      createdAt: z.string().datetime().describe('Account creation timestamp'),
      updatedAt: z.string().datetime().describe('Last update timestamp')
    }));

    // Assessment schema
    this.builder.addSchema('Assessment', z.object({
      id: z.string().uuid().describe('Assessment ID'),
      title: z.string().max(200).describe('Assessment title'),
      description: z.string().max(1000).describe('Assessment description'),
      type: z.enum(['wellness', 'relationship', 'career', 'mental_health']).describe('Assessment type'),
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Assessment difficulty'),
      estimatedTime: z.number().int().min(1).describe('Estimated completion time in minutes'),
      questions: z.array(z.object({
        id: z.string().uuid().describe('Question ID'),
        text: z.string().max(500).describe('Question text'),
        type: z.enum(['multiple_choice', 'scale', 'text', 'boolean']).describe('Question type'),
        options: z.array(z.string()).optional().describe('Answer options for multiple choice'),
        required: z.boolean().default(true).describe('Whether the question is required')
      })).describe('Assessment questions'),
      createdAt: z.string().datetime().describe('Creation timestamp'),
      updatedAt: z.string().datetime().describe('Last update timestamp')
    }));

    // Chat message schema
    this.builder.addSchema('ChatMessage', z.object({
      id: z.string().uuid().describe('Message ID'),
      conversationId: z.string().uuid().describe('Conversation ID'),
      senderId: z.string().uuid().describe('Sender ID'),
      content: z.string().max(10000).describe('Message content'),
      type: z.enum(['text', 'audio', 'image', 'system']).default('text').describe('Message type'),
      timestamp: z.string().datetime().describe('Message timestamp'),
      metadata: z.object({}).optional().describe('Additional message metadata')
    }));

    // Gamification schema
    this.builder.addSchema('Achievement', z.object({
      id: z.string().uuid().describe('Achievement ID'),
      name: z.string().max(100).describe('Achievement name'),
      description: z.string().max(500).describe('Achievement description'),
      icon: z.string().url().describe('Achievement icon URL'),
      points: z.number().int().min(0).describe('Points awarded'),
      category: z.string().max(50).describe('Achievement category'),
      rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']).describe('Achievement rarity'),
      unlockedAt: z.string().datetime().optional().describe('Unlock timestamp')
    }));

    // API key schema
    this.builder.addSchema('APIKey', z.object({
      id: z.string().uuid().describe('API key ID'),
      name: z.string().max(100).describe('API key name'),
      key: z.string().describe('API key (returned only on creation)'),
      permissions: z.array(z.string()).describe('API key permissions'),
      expiresAt: z.string().datetime().optional().describe('Expiration timestamp'),
      lastUsedAt: z.string().datetime().optional().describe('Last usage timestamp'),
      createdAt: z.string().datetime().describe('Creation timestamp')
    }));
  }

  private addAuthEndpoints(): void {
    // Login endpoint
    this.builder.addPath('/api/auth/login', {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({
                email: z.string().email().describe('User email'),
                password: z.string().min(8).describe('User password')
              })
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: z.object({
                  accessToken: z.string().describe('JWT access token'),
                  refreshToken: z.string().describe('JWT refresh token'),
                  user: z.object({ $ref: '#/components/schemas/User' }).describe('User information')
                })
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    });

    // Refresh token endpoint
    this.builder.addPath('/api/auth/refresh', {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Refresh JWT access token using refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({
                refreshToken: z.string().describe('JWT refresh token')
              })
            }
          }
        },
        responses: {
          '200': {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: z.object({
                  accessToken: z.string().describe('New JWT access token'),
                  refreshToken: z.string().describe('New JWT refresh token')
                })
              }
            }
          },
          '401': {
            description: 'Invalid refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    });
  }

  private addUserEndpoints(): void {
    // Get current user
    this.builder.addPath('/api/users/me', {
      get: {
        tags: ['Users'],
        summary: 'Get current user',
        description: 'Retrieve the authenticated user\'s profile',
        responses: {
          '200': {
            description: 'User profile retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    });

    // Update user profile
    this.builder.addPath('/api/users/me', {
      patch: {
        tags: ['Users'],
        summary: 'Update user profile',
        description: 'Update the authenticated user\'s profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({
                displayName: z.string().max(100).optional().describe('Display name'),
                avatar: z.string().url().optional().describe('Avatar URL'),
                bio: z.string().max(500).optional().describe('User bio')
              })
            }
          }
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    });
  }

  private addAssessmentEndpoints(): void {
    // Get available assessments
    this.builder.addPath('/api/assessments', {
      get: {
        tags: ['Assessments'],
        summary: 'Get available assessments',
        description: 'Retrieve a list of available wellness assessments',
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: z.enum(['wellness', 'relationship', 'career', 'mental_health']).optional(),
            description: 'Filter by assessment type'
          },
          {
            name: 'difficulty',
            in: 'query',
            schema: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
            description: 'Filter by difficulty level'
          }
        ],
        responses: {
          '200': {
            description: 'Assessments retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  assessments: z.array(z.object({ $ref: '#/components/schemas/Assessment' })),
                  pagination: { $ref: '#/components/schemas/Pagination' }
                })
              }
            }
          }
        }
      }
    });

    // Start assessment
    this.builder.addPath('/api/assessments/{id}/start', {
      post: {
        tags: ['Assessments'],
        summary: 'Start assessment',
        description: 'Start a new assessment session',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: z.string().uuid(),
            description: 'Assessment ID'
          }
        ],
        responses: {
          '200': {
            description: 'Assessment started successfully',
            content: {
              'application/json': {
                schema: z.object({
                  sessionId: z.string().uuid().describe('Assessment session ID'),
                  assessment: { $ref: '#/components/schemas/Assessment' }
                })
              }
            }
          },
          '404': {
            description: 'Assessment not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    });
  }

  private addChatEndpoints(): void {
    // Get conversations
    this.builder.addPath('/api/chat/conversations', {
      get: {
        tags: ['Chat'],
        summary: 'Get user conversations',
        description: 'Retrieve the authenticated user\'s chat conversations',
        responses: {
          '200': {
            description: 'Conversations retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  conversations: z.array(z.object({
                    id: z.string().uuid(),
                    title: z.string().max(200),
                    lastMessage: z.string().datetime(),
                    unreadCount: z.number().int().min(0),
                    participants: z.array(z.object({ $ref: '#/components/schemas/User' }))
                  }))
                })
              }
            }
          }
        }
      }
    });

    // Send message
    this.builder.addPath('/api/chat/conversations/{id}/messages', {
      post: {
        tags: ['Chat'],
        summary: 'Send message',
        description: 'Send a message to a conversation',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: z.string().uuid(),
            description: 'Conversation ID'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({
                content: z.string().max(10000).describe('Message content'),
                type: z.enum(['text', 'audio', 'image']).default('text').describe('Message type')
              })
            }
          }
        },
        responses: {
          '200': {
            description: 'Message sent successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChatMessage' }
              }
            }
          }
        }
      }
    });
  }

  private addGamificationEndpoints(): void {
    // Get user achievements
    this.builder.addPath('/api/gamification/achievements', {
      get: {
        tags: ['Gamification'],
        summary: 'Get user achievements',
        description: 'Retrieve the authenticated user\'s achievements',
        responses: {
          '200': {
            description: 'Achievements retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  achievements: z.array(z.object({ $ref: '#/components/schemas/Achievement' })),
                  totalPoints: z.number().int().min(0),
                  level: z.number().int().min(1),
                  nextLevelPoints: z.number().int().min(0)
                })
              }
            }
          }
        }
      }
    });

    // Get leaderboard
    this.builder.addPath('/api/gamification/leaderboard', {
      get: {
        tags: ['Gamification'],
        summary: 'Get leaderboard',
        description: 'Retrieve the global leaderboard',
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: z.enum(['daily', 'weekly', 'monthly', 'all_time']).default('weekly'),
            description: 'Time period for leaderboard'
          },
          {
            name: 'limit',
            in: 'query',
            schema: z.number().int().min(1).max(100).default(50),
            description: 'Number of leaderboard entries'
          }
        ],
        responses: {
          '200': {
            description: 'Leaderboard retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  leaderboard: z.array(z.object({
                    rank: z.number().int().min(1),
                    user: z.object({ $ref: '#/components/schemas/User' }),
                    points: z.number().int().min(0),
                    achievements: z.number().int().min(0)
                  })),
                  currentUserRank: z.number().int().min(1).optional()
                })
              }
            }
          }
        }
      }
    });
  }

  private addCommunityEndpoints(): void {
    // Get community posts
    this.builder.addPath('/api/community/posts', {
      get: {
        tags: ['Community'],
        summary: 'Get community posts',
        description: 'Retrieve community posts and discussions',
        parameters: [
          {
            name: 'category',
            in: 'query',
            schema: z.enum(['general', 'wellness', 'relationships', 'career']).optional(),
            description: 'Filter by category'
          },
          {
            name: 'sort',
            in: 'query',
            schema: z.enum(['recent', 'popular', 'trending']).default('recent'),
            description: 'Sort order'
          }
        ],
        responses: {
          '200': {
            description: 'Posts retrieved successfully',
            content: {
              'application/json': {
                schema: z.object({
                  posts: z.array(z.object({
                    id: z.string().uuid(),
                    title: z.string().max(200),
                    content: z.string().max(5000),
                    author: z.object({ $ref: '#/components/schemas/User' }),
                    likes: z.number().int().min(0),
                    comments: z.number().int().min(0),
                    createdAt: z.string().datetime()
                  })),
                  pagination: { $ref: '#/components/schemas/Pagination' }
                })
              }
            }
          }
        }
      }
    });

    // Create community post
    this.builder.addPath('/api/community/posts', {
      post: {
        tags: ['Community'],
        summary: 'Create community post',
        description: 'Create a new community post or discussion',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: z.object({
                title: z.string().max(200).describe('Post title'),
                content: z.string().max(5000).describe('Post content'),
                category: z.enum(['general', 'wellness', 'relationships', 'career']).describe('Post category')
              })
            }
          }
        },
        responses: {
          '201': {
            description: 'Post created successfully',
            content: {
              'application/json': {
                schema: z.object({
                  id: z.string().uuid().describe('Post ID'),
                  title: z.string().max(200),
                  content: z.string().max(5000),
                  author: z.object({ $ref: '#/components/schemas/User' }),
                  likes: z.number().int().min(0),
                  comments: z.number().int().min(0),
                  createdAt: z.string().datetime()
                })
              }
            }
          },
          '400': {
            description: 'Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    });
  }
}

// API documentation middleware
export function createAPIDocumentationMiddleware(spec: OpenAPISpec) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Serve OpenAPI specification
    if (req.path === '/api/docs/openapi.json') {
      res.json(spec);
      return;
    }

    // Serve Swagger UI
    if (req.path === '/api/docs') {
      const swaggerUI = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>NewMe API Documentation</title>
          <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css">
          <style>
            body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info { margin: 50px 0; }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
          <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
          <script>
            window.onload = function() {
              SwaggerUIBundle({
                url: "/api/docs/openapi.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],
                plugins: [
                  SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
              });
            };
          </script>
        </body>
        </html>
      `;
      res.send(swaggerUI);
      return;
    }

    next();
  };
}

// API documentation service
export class APIDocumentationService {
  private spec: OpenAPISpec | null = null;

  generateDocumentation(): OpenAPISpec {
    if (!this.spec) {
      const generator = new APIDocumentationGenerator('NewMe Wellness Platform API', '1.0.0');
      this.spec = generator.generateWellnessAPI();
      
      logger.info('API documentation generated', {
        title: this.spec.info.title,
        version: this.spec.info.version,
        paths: Object.keys(this.spec.paths).length,
        schemas: Object.keys(this.spec.components?.schemas || {}).length
      });
    }

    return this.spec;
  }

  getSpec(): OpenAPISpec {
    if (!this.spec) {
      return this.generateDocumentation();
    }
    return this.spec;
  }

  updateSpec(updates: Partial<OpenAPISpec>): void {
    if (this.spec) {
      this.spec = { ...this.spec, ...updates };
      logger.info('API documentation updated');
    }
  }

  validateSpec(): { valid: boolean; errors: string[] } {
    if (!this.spec) {
      return { valid: false, errors: ['No specification loaded'] };
    }

    const errors: string[] = [];

    // Basic validation
    if (!this.spec.openapi) {
      errors.push('Missing OpenAPI version');
    }

    if (!this.spec.info?.title) {
      errors.push('Missing API title');
    }

    if (!this.spec.info?.version) {
      errors.push('Missing API version');
    }

    if (!this.spec.paths || Object.keys(this.spec.paths).length === 0) {
      errors.push('No paths defined');
    }

    // Validate paths
    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      if (!pathItem) {
        errors.push(`Empty path item for path: ${path}`);
        continue;
      }

      const methods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];
      let hasOperation = false;

      for (const method of methods) {
        const operation = (pathItem as Record<string, unknown>)[method] as OpenAPIOperation | undefined;
        if (operation) {
          hasOperation = true;
          
          if (!operation.responses) {
            errors.push(`Missing responses for ${method.toUpperCase()} ${path}`);
          }
        }
      }

      if (!hasOperation) {
        errors.push(`No operations defined for path: ${path}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const apiDocumentationService = new APIDocumentationService();