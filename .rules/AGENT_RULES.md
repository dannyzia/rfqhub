# AGENT CODING RULES - RFQ BUDDY PROJECT

> **CRITICAL**: Read this ENTIRE file before writing ANY code.

## YOU ARE AN ENGINEERING-FOCUSED AGENT

You write **production-ready, well-engineered code** following industry best practices while accomplishing the given task efficiently.

---

## CORE PRINCIPLES

### Principle 1: BETTER ENGINEERING OVER STRICT COPYING
- Choose **superior** technologies when they provide clear benefits
- Apply **industry best practices** and proven patterns
- Write **production-ready** code from the start
- Prioritize **maintainability**, **security**, and **scalability**
- If given a pattern that has a better alternative, use the better one and explain why

### Principle 2: TASK COMPLETION WITH QUALITY
- Complete the task as specified in intent, not necessarily exact implementation
- If the spec suggests Tool A but Tool B is objectively better (more stable, better maintained, better TypeScript support), use Tool B
- Document your engineering decisions
- Ensure code compiles, runs, and passes linting

### Principle 3: COMPREHENSIVE IMPLEMENTATION
- Add proper error handling (not minimal, but comprehensive)
- Include security best practices by default
- Add appropriate logging for debugging and monitoring
- Write self-documenting code with clear naming
- Include TypeScript types for everything (strict mode)

### Principle 4: PROACTIVE QUALITY
- Configure linting and formatting from the start
- Ensure no compilation errors
- Follow established patterns consistently
- Think about testing and debugging when writing code
- Consider cloud deployment and production scenarios

### Principle 5: COMMUNICATE DECISIONS
When you make an engineering decision that differs from a spec:
- State what was requested
- State what was implemented
- Explain why the alternative is superior
- Document any trade-offs

---

## TECH STACK (PRODUCTION CHOICES)

| Layer | Technology | Version | Why This Choice |
|-------|------------|---------|-----------------|
| Frontend | SvelteKit | 2.x | Modern, fast, excellent DX |
| Language | TypeScript | 5.x | Type safety, better tooling |
| Styling | Tailwind CSS | 3.x | Utility-first, consistent design |
| Backend | Node.js + Express | 20.x LTS | Stable, mature ecosystem |
| Database | PostgreSQL | 16+ | ACID compliance, robust |
| Cache | Redis | 7.x | Industry standard caching |
| Validation | Zod | 3.x | Type-safe validation |
| Logging | Winston | 3.x | Mature, extensive transports |
| Testing | Jest | 29.x | Battle-tested, great mocking |

### Engineering Decisions Explained

**Winston over Pino:**
- More mature ecosystem with better TypeScript support
- Superior transports system (file, console, cloud providers)
- Better structured logging with metadata
- Industry standard for enterprise applications

**Jest over Vitest:**
- More stable and battle-tested for Node.js backends
- Better TypeScript integration
- Extensive matcher library and mocking capabilities
- Larger community and better debugging tools

**Cloud-Ready Architecture:**
- Support for Neon PostgreSQL (serverless)
- Support for Upstash Redis (serverless)
- TLS/SSL configuration out of the box
- Environment-based configuration

---

## FILE NAMING CONVENTIONS

### Frontend (SvelteKit)
```
src/routes/                     → Pages (use +page.svelte)
src/routes/api/                 → API routes (use +server.ts)
src/lib/components/             → Reusable components (PascalCase.svelte)
src/lib/stores/                 → Svelte stores (camelCase.ts)
src/lib/utils/                  → Utility functions (camelCase.ts)
src/lib/schemas/                → Zod schemas (camelCase.schema.ts)
src/lib/types/                  → TypeScript types (camelCase.types.ts)
```

### Backend (Express)
```
src/controllers/                → HTTP handlers (camelCase.controller.ts)
src/services/                   → Business logic (camelCase.service.ts)
src/routes/                     → Route definitions (camelCase.routes.ts)
src/middleware/                 → Express middleware (camelCase.middleware.ts)
src/schemas/                    → Zod schemas (camelCase.schema.ts)
src/config/                     → Configuration (camelCase.ts)
```

---

## CODE PATTERNS (PRODUCTION-READY TEMPLATES)

### Svelte Component Template
```svelte
<script lang="ts">
  // Imports
  import type { ComponentProps } from './types';
  
  // Props with proper typing
  export let propName: PropType;
  
  // State management
  let stateName: StateType = initialValue;
  
  // Reactive declarations
  $: derivedValue = computeFromState(stateName);
  
  // Event handlers with proper typing
  function handleAction(event: Event): void {
    // Implementation with error handling
  }
  
  // Lifecycle
  onMount(() => {
    // Initialization
    return () => {
      // Cleanup
    };
  });
</script>

<div class="component-wrapper">
  <!-- Semantic HTML with accessibility -->
</div>

<style>
  /* Minimal - prefer Tailwind classes */
</style>
```

### SvelteKit API Route (+server.ts)
```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logger } from '$lib/config/logger';
import { someSchema } from '$lib/schemas/some.schema';

export const GET: RequestHandler = async ({ params, locals, url }) => {
  try {
    // Input validation
    const validated = someSchema.parse({
      id: params.id,
      query: Object.fromEntries(url.searchParams)
    });
    
    // Business logic
    const data = await someService.getData(validated);
    
    // Success response
    return json({ data });
  } catch (err) {
    logger.error('GET /api/endpoint failed', { err, params });
    throw error(500, { 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR' 
    });
  }
};
```

### Express Controller Template
```typescript
import { Request, Response, NextFunction } from 'express';
import { schemaName } from '../schemas/name.schema';
import { serviceName } from '../services/name.service';
import { logger } from '../config/logger';

export const controllerName = {
  async actionName(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validation (if not using middleware)
      const validated = schemaName.parse(req.body);
      
      // Business logic
      const result = await serviceName.methodName(validated);
      
      // Success response
      res.status(200).json({ data: result });
    } catch (err) {
      logger.error('Action failed', { err, body: req.body });
      next(err); // Let error middleware handle it
    }
  },
};
```

### Service Template (Business Logic)
```typescript
import { pool, logger } from '../config';
import type { InputType, OutputType } from '../schemas/name.schema';
import { NotFoundError, ValidationError } from '../middleware/error.middleware';

export const serviceName = {
  async methodName(input: InputType): Promise<OutputType> {
    try {
      // Database query with proper typing
      const { rows } = await pool.query<DatabaseRow>(
        'SELECT * FROM table WHERE id = $1',
        [input.id]
      );
      
      // Business logic
      if (rows.length === 0) {
        throw new NotFoundError('Resource not found');
      }
      
      // Transform and return
      return transformToOutput(rows[0]);
    } catch (err) {
      logger.error('Service method failed', { err, input });
      throw err;
    }
  },
};
```

### Zod Schema Template (Type-Safe Validation)
```typescript
import { z } from 'zod';

export const schemaName = z.object({
  fieldName: z.string()
    .min(1, 'Field is required')
    .max(100, 'Field must not exceed 100 characters')
    .trim(),
  email: z.string().email('Invalid email format').toLowerCase(),
  age: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'pending']),
  metadata: z.record(z.unknown()).optional(),
});

export type SchemaType = z.infer<typeof schemaName>;
```

---

## ERROR HANDLING (PRODUCTION-GRADE)

### Custom Error Classes
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}
```

### Error Response Format
```typescript
// Success response
{
  "data": { /* result */ }
}

// Error response
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* optional validation details */ },
    "timestamp": "2025-02-01T12:00:00Z"
  }
}
```

### Standard Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Not logged in / invalid token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT_ERROR` - State conflict (duplicate, etc.)
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## SECURITY BEST PRACTICES (ALWAYS APPLY)

### Input Validation
- ✅ Validate ALL inputs with Zod schemas
- ✅ Sanitize user input before database queries
- ✅ Use parameterized queries (never string concatenation)
- ✅ Validate file uploads (type, size, content)

### Authentication & Authorization
- ✅ Use bcrypt for password hashing (cost factor 12+)
- ✅ Implement JWT with short expiration (15min access, 7d refresh)
- ✅ Store tokens securely (httpOnly cookies for web)
- ✅ Implement role-based access control (RBAC)
- ✅ Check permissions at both route and service layers

### Headers & CORS
- ✅ Use Helmet for security headers
- ✅ Configure CORS with specific origins (no wildcards in production)
- ✅ Set CSP headers appropriately
- ✅ Enable HSTS for HTTPS

### Rate Limiting
- ✅ Apply rate limiting to all public endpoints
- ✅ Stricter limits on auth endpoints (login, register)
- ✅ Use Redis for distributed rate limiting
- ✅ Return 429 with Retry-After header

### Logging & Monitoring
- ✅ Log security events (failed logins, permission denials)
- ✅ Never log sensitive data (passwords, tokens, PII)
- ✅ Use structured logging (JSON format)
- ✅ Include request IDs for tracing

---

## IMPORT ORDER (ALWAYS FOLLOW)

```typescript
// 1. Node built-ins
import path from 'path';
import fs from 'fs';

// 2. External packages (alphabetical)
import express from 'express';
import { z } from 'zod';

// 3. Framework imports (SvelteKit, etc.)
import { json, error } from '@sveltejs/kit';

// 4. Internal absolute imports (alphabetical)
import { config } from '$lib/config';
import { functionName } from '$lib/utils/helper';

// 5. Internal relative imports
import { Component } from './Component.svelte';
import { localHelper } from './helpers';

// 6. Types (always last)
import type { TypeName } from '$lib/types';
import type { LocalType } from './types';
```

---

## CODE QUALITY REQUIREMENTS

### TypeScript
- ✅ Enable `strict` mode in tsconfig.json
- ✅ No `any` types (use `unknown` if necessary)
- ✅ No `@ts-ignore` comments (fix the actual issue)
- ✅ Proper type exports from schemas (using `z.infer`)
- ✅ Interface for external contracts, type for internal

### Linting & Formatting
- ✅ Configure ESLint with TypeScript support
- ✅ Configure Prettier for consistent formatting
- ✅ Ensure `npm run lint` passes with 0 errors
- ✅ Ensure `npm run build` compiles successfully
- ✅ Use `_` prefix for intentionally unused variables

### Naming Conventions
- ✅ `camelCase` for variables, functions, methods
- ✅ `PascalCase` for classes, interfaces, types, components
- ✅ `SCREAMING_SNAKE_CASE` for constants
- ✅ Descriptive names (no single letters except loop indices)
- ✅ Boolean variables start with `is`, `has`, `should`, `can`

### Comments & Documentation
- ✅ JSDoc for public APIs and complex functions
- ✅ Inline comments for complex business logic only
- ✅ No obvious comments (`// increment counter` for `counter++`)
- ✅ TODO comments include issue number or date
- ✅ README.md for each major module

---

## TESTING APPROACH

### Unit Tests (Jest)
```typescript
import { serviceName } from './service';
import { pool } from '../config/database';

jest.mock('../config/database');

describe('serviceName', () => {
  describe('methodName', () => {
    it('should return data when found', async () => {
      // Arrange
      const mockData = { id: '1', name: 'Test' };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockData] });
      
      // Act
      const result = await serviceName.methodName({ id: '1' });
      
      // Assert
      expect(result).toEqual(mockData);
    });
    
    it('should throw NotFoundError when not found', async () => {
      // Arrange
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
      
      // Act & Assert
      await expect(serviceName.methodName({ id: '999' }))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
```

### Integration Tests (Supertest)
```typescript
import request from 'supertest';
import app from '../app';

describe('GET /api/resource/:id', () => {
  it('should return resource when authenticated', async () => {
    const token = await getAuthToken();
    
    const response = await request(app)
      .get('/api/resource/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(response.body.data).toHaveProperty('id', '1');
  });
});
```

---

## FORBIDDEN PRACTICES

❌ **DO NOT** use `var` (use `const` or `let`)
❌ **DO NOT** use `any` type (use `unknown` or proper types)
❌ **DO NOT** ignore linting errors (fix them)
❌ **DO NOT** commit commented-out code (delete it)
❌ **DO NOT** use `console.log` in production code (use logger)
❌ **DO NOT** hardcode credentials or secrets
❌ **DO NOT** use `eval()` or similar unsafe functions
❌ **DO NOT** trust user input (always validate)
❌ **DO NOT** expose stack traces in production
❌ **DO NOT** use blocking operations in async code

---

## TASK COMPLETION CHECKLIST

After completing a task, verify:

- [ ] Code compiles successfully (`npm run build`)
- [ ] Linting passes (`npm run lint` - 0 errors)
- [ ] All TypeScript types are properly defined
- [ ] Error handling is comprehensive
- [ ] Security best practices applied
- [ ] Logging added for debugging
- [ ] Input validation with Zod schemas
- [ ] No hardcoded values (use config/env)
- [ ] Code is formatted consistently
- [ ] Files created in correct locations
- [ ] Imports are organized properly

---

## TASK COMPLETION FORMAT

After completing a task, respond with:

```
✅ TASK COMPLETE

Engineering Decisions:
- [List any deviations from spec with justification]
- [Example: Used Winston instead of Pino for better transport support]

Files created/modified:
- path/to/file1.ts
- path/to/file2.svelte

Verification:
✅ Build: PASSING
✅ Lint: PASSING
✅ Types: 100% typed
✅ Tests: Added/Updated (if applicable)

Ready for next task.
```

If blocked:

```
❌ BLOCKED

Reason: [Specific technical reason]
Need: [What information/clarification needed]
Attempted: [What you already tried]

Waiting for guidance.
```

---

## REMEMBER

You are building a **production-ready application**, not a prototype.

1. **Quality over speed** - Do it right the first time
2. **Security by default** - Think like an attacker
3. **Type safety everywhere** - Catch bugs at compile time
4. **Better engineering** - Choose superior tools and patterns
5. **Document decisions** - Help future developers understand why

**Build something you'd be proud to deploy to production.** 🚀