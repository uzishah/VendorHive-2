# TypeScript Issues and Solutions

This document tracks TypeScript issues encountered during the VendorHive codebase restructuring and their solutions.

## Current Issues

### backend/src/routes.ts
1. **Issue**: Invalid property `id` in Vendor objects
   ```
   Object literal may only specify known properties, and 'id' does not exist in type 
   '{ userId: string | number; businessName: string; category: string; description: string; coverImage?: string | undefined; services?: string[] | undefined; businessHours?: Record<string, any> | undefined; }'.
   ```
   **Solution**: Update the Vendor Zod schema to include the `id` property or use type assertion.

### backend/src/storage.ts
1. **Issue**: Type mismatch with string|number vs. number
   ```
   Argument of type 'string | number' is not assignable to parameter of type 'number'.
   Type 'string' is not assignable to type 'number'.
   ```
   **Solution**: Add type conversion or narrowing when passing userId to ensure it's always a number.

2. **Issue**: Iterator compatibility
   ```
   Type 'MapIterator<Vendor>' can only be iterated through when using the '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.
   ```
   **Solution**: Update tsconfig.json to use target ES2015 or higher, or use Array.from() to convert iterators to arrays.

### backend/src/vite.ts
1. **Issue**: Type mismatch in Vite server options
   ```
   Type '{ middlewareMode: boolean; hmr: { server: Server<typeof IncomingMessage, typeof ServerResponse>; }; allowedHosts: boolean; }' is not assignable to type 'ServerOptions'.
   Types of property 'allowedHosts' are incompatible.
   Type 'boolean' is not assignable to type 'true | string[] | undefined'.
   ```
   **Solution**: Update the allowedHosts property to be either true, an array of strings, or undefined.

## Resolved Issues

*(None yet - issues will be moved here as they are resolved)*

## General TypeScript Configuration Improvements

1. **Recommendation**: Update tsconfig.json with more specific settings:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "esModuleInterop": true,
       "strict": true,
       "forceConsistentCasingInFileNames": true,
       "skipLibCheck": true,
       "baseUrl": ".",
       "paths": {
         "@/*": ["src/*"],
         "@models/*": ["src/models/*"],
         "@config/*": ["src/config/*"]
       }
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

2. **Recommendation**: Add ESLint configuration with TypeScript support:
   ```json
   {
     "extends": [
       "eslint:recommended",
       "plugin:@typescript-eslint/recommended"
     ],
     "parser": "@typescript-eslint/parser",
     "plugins": ["@typescript-eslint"],
     "root": true
   }
   ```

## Next Steps for TypeScript Improvements

1. Add better type-safety for MongoDB operations
2. Create more specific types for API requests and responses
3. Improve error handling with typed errors
4. Add comprehensive JSDoc comments for better IDE integration