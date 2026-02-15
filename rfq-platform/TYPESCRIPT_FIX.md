# TypeScript Compilation Fix - Backend

## Issue
Backend failed to start with TypeScript compilation errors when using `ts-node`:

```
TSError: ⨯ Unable to compile TypeScript:
src/middleware/rateLimit.middleware.ts:12:14 - error TS2339: Property 'user' does not exist on type 'Request'.
src/middleware/rateLimit.middleware.ts:91:44 - error TS2339: Property 'user' does not exist on type 'Request'.
```

Note: `npm run build` worked fine, but `npm run dev` (using ts-node) failed.

## Root Cause
The Express `Request` type extension was declared in `auth.middleware.ts` but TypeScript wasn't recognizing it in other files (`rateLimit.middleware.ts`).

**Two issues identified:**
1. Global type declarations in regular `.ts` files can sometimes not be properly merged across the entire project
2. `ts-node` (used in dev mode) has different type resolution behavior than `tsc` (used in build)

## Solution

### 1. Created Global Type Definition File
Created `src/types/express.d.ts`:

```typescript
// Global type definitions for Express
// This file extends the Express Request interface to include custom properties

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        roles: string[];
        companyId?: string;
        orgId: string;
      };
    }
  }
}

export {};
```

**Key Points:**
- Placed in a dedicated `types` directory
- Uses `.d.ts` extension (TypeScript declaration file)
- Contains only type declarations, no runtime code
- The `export {}` makes it a module, ensuring proper global scope merging

### 2. Removed Duplicate Declaration
Removed the duplicate type declaration from `src/middleware/auth.middleware.ts`:

**Before:**
```typescript
// Extend Express Request to include user
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        roles: string[];
        companyId?: string;
        orgId: string;
      };
    }
  }
}
```

**After:**
```typescript
// Express Request type extension is defined in src/types/express.d.ts
```

### 3. TypeScript Configuration
No changes needed to `tsconfig.json` - it already includes all source files:

```json
{
  "include": ["src/**/*"],
  ...
}
```

This automatically picks up the `src/types/express.d.ts` file.

### 3. Updated ts-node Configuration

Modified `package.json` dev script to include `--files` flag:

**Before:**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts"
  }
}
```

**After:**
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node --files src/server.ts"
  }
}
```

The `--files` flag tells ts-node to load all files including `.d.ts` declaration files.

### 4. Updated tsconfig.json

Added explicit configuration for ts-node and type roots:

```json
{
  "compilerOptions": {
    ...
    "typeRoots": ["./node_modules/@types", "./src/types"],
  },
  "include": ["src/**/*", "src/types/**/*.d.ts"],
  "ts-node": {
    "files": true,
    "transpileOnly": false,
    "compilerOptions": {
      "module": "commonjs",
    },
  },
}
```

### 5. Added Type Reference

Added a triple-slash directive at the top of `rateLimit.middleware.ts`:

```typescript
/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
```

This ensures the type definitions are explicitly loaded.

## Verification

### Build Test
```bash
cd rfq-platform/backend
npm run build
```

**Result:** ✅ SUCCESS - No TypeScript errors

### Development Server
```bash
npm run dev
```

**Result:** ✅ SUCCESS - Server starts without compilation errors

**Output:**
```
[nodemon] starting `ts-node --files src/server.ts`
Logger initialized in development mode
Scheduled tasks initialized
✅ Redis connected successfully (Upstash)
✅ Database connected successfully (Neon PostgreSQL)
Server running on port 3000
```

## Best Practices Applied

1. **Separation of Concerns**
   - Type definitions separated from implementation
   - Global types in dedicated `types/` directory

2. **Single Source of Truth**
   - One declaration file for Express extensions
   - Prevents duplicate/conflicting type definitions

3. **Proper Module Structure**
   - `.d.ts` extension for declaration-only files
   - `export {}` to ensure module scope

4. **Documentation**
   - Clear comments explaining the purpose
   - Reference comment in auth.middleware.ts

## Files Changed

- ✅ Created: `src/types/express.d.ts` - Global Express type definitions
- ✅ Modified: `src/middleware/auth.middleware.ts` - Removed duplicate declaration
- ✅ Modified: `src/middleware/rateLimit.middleware.ts` - Added type reference
- ✅ Modified: `tsconfig.json` - Added ts-node config and typeRoots
- ✅ Modified: `package.json` - Added --files flag to dev script

## Impact

- **Zero Runtime Impact** - Only affects TypeScript compilation
- **Improved Type Safety** - `req.user` now properly typed everywhere
- **Better Maintainability** - Single location for Express type extensions
- **Cleaner Code** - No duplicate declarations

## Future Considerations

If you need to add more custom properties to Express types:
1. Add them to `src/types/express.d.ts`
2. No need to modify individual middleware files
3. Changes automatically available project-wide

## Related Files

Files that use `req.user`:
- `src/middleware/auth.middleware.ts`
- `src/middleware/rateLimit.middleware.ts`
- Various controllers (tender, bid, user, etc.)

All now properly typed with no TypeScript errors.

## Key Learnings

1. **ts-node vs tsc**: Development and build tooling can have different TypeScript configurations
2. **--files flag**: Essential for ts-node to properly load `.d.ts` files
3. **Triple-slash directives**: Useful for explicit type references when needed
4. **typeRoots**: Must be explicitly configured when using custom type directories
5. **Separation of concerns**: Keep global type definitions in dedicated `.d.ts` files

## Troubleshooting

If you encounter similar issues:

1. Check if `npm run build` works but `npm run dev` fails → ts-node configuration issue
2. Verify `.d.ts` files are in a directory covered by `include` in tsconfig.json
3. Add `--files` flag to ts-node command
4. Use triple-slash directives if types still aren't loading
5. Check `typeRoots` includes your custom types directory

---

**Status:** ✅ RESOLVED
**Date:** 2025-02-01
**Build:** ✅ PASSING
**Dev Server:** ✅ RUNNING