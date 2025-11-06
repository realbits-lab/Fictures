# Fictures Web API Documentation

Complete API reference for the Fictures web application.

## Overview

The Fictures web application provides RESTful APIs for story creation, image generation, user management, and content validation. All APIs follow standard HTTP methods and return JSON responses.

## Base URL

```
Development: http://localhost:3000
Production: https://fictures.xyz
```

## Authentication

Most API endpoints require authentication using one of the following methods:

### Session Authentication (Default)
- Uses NextAuth.js session management
- Automatically handled by the browser via cookies
- Used for web application requests

### API Key Authentication (Optional)
- Available for programmatic access
- Send API key in `Authorization` header: `Bearer YOUR_API_KEY`
- Requires appropriate scopes (e.g., `stories:write`)

## API Categories

### Authentication APIs
User registration, login, and password management.
- [Authentication APIs](./authentication.md)

### Image APIs
AI-powered image generation and upload for stories.
- [Image APIs](./images.md)

### Validation APIs
Content validation and dialogue formatting services.
- [Validation APIs](./validation.md)

### User Management APIs
User role management and profile updates.
- [User Management APIs](./users.md)

### Admin APIs
Administrative operations requiring elevated permissions.
- [Admin APIs](./admin.md)

### Cron APIs
Scheduled tasks for analytics and maintenance.
- [Cron APIs](./cron.md)

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details"
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

## Rate Limiting

API endpoints may be rate-limited to ensure service stability:
- Authentication endpoints: 10 requests per minute
- Image generation: 5 requests per minute
- Other endpoints: 60 requests per minute

## Error Handling

All errors include descriptive messages. Common error types:

```json
{
  "error": "ValidationError",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Pagination

List endpoints support pagination using query parameters:

```
?page=1&limit=20
```

Response includes pagination metadata:

```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Environment Variables

Required environment variables for API operations:

```bash
# Authentication
AUTH_SECRET=your-auth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Integration
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key

# Database & Storage
DATABASE_URL=your-neon-postgres-url
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Cron Security
CRON_SECRET=your-cron-secret
```

## Development

### Testing APIs

Use the provided test scripts for API testing:

```bash
# Test image generation
dotenv --file .env.local run node scripts/test-imagen-generation.mjs

# Test story generation
dotenv --file .env.local run node scripts/generate-minimal-story.mjs
```

### Running Development Server

```bash
cd apps/web
dotenv --file .env.local run pnpm dev
```

## Related Documentation

- [Novel Generation System](../novels/novels-specification.md)
- [Image Generation & Optimization](../image/image-generation.md)
- [Authentication System](../auth/authentication-profiles.md)
- [Database Schema](../../drizzle/schema.ts)

## Support

For API issues or questions:
- GitHub Issues: https://github.com/realbits-lab/Fictures/issues
- Documentation: https://github.com/realbits-lab/Fictures/tree/main/apps/web/docs
