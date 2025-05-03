# Path Aliases in Chrome Control

**Note: Path aliases have been removed from the project. This document is kept for historical reference only.**

~~This document explains the path alias system used in Chrome Control and our approach to implementing them consistently across the codebase.~~

## Current Path Alias Setup

The project uses path aliases to make imports cleaner and more maintainable. These aliases are defined in `tsconfig.json`:

```json
"paths": {
  "@src/*": ["src/*"],
  "@tools/*": ["src/tools/*"],
  "@utils/*": ["src/utils/*"],
  "@types/*": ["src/types/*"],
  "@tests/*": ["tests/*"]
}
```

These aliases are used throughout the codebase to make imports more maintainable, especially when files move to different directories.

## Usage in Different File Types

### TypeScript Files (Non-Test)

Path aliases work well in regular TypeScript files. For example:

```typescript
// Instead of this:
import { Tool } from '../types/tool.js';

// Use this:
import { Tool } from '@types/tool.js';
```

### Test Files (.__TEST__.ts)

Currently, path aliases have some limitations in test files due to ES Modules compatibility and the testing setup. For now, we're using relative imports in test files:

```typescript
// Currently using:
import { startMockServer } from '../../../tests/utils/test-utils.js';

// We want to use this in the future:
import { startMockServer } from '@tests/utils/test-utils.js';
```

## Known Issues and Workarounds

1. **ES Modules vs CommonJS**: The project uses ES Modules (`"type": "module"` in package.json), which affects how imports work.
2. **TypeScript Compilation**: Tests run through ts-node which needs special configuration for path aliases.
3. **Module Resolution**: Tests need to include the `.js` extension in imports to work correctly.

### Current Workarounds

1. Test files use relative imports with `.js` extensions:
   ```typescript
   import { functionName } from './index.js';
   import { utils } from '../../../tests/utils/test-utils.js';
   ```

2. The build system retains compatibility with both approaches using:
   - `module-alias` for runtime aliasing
   - TypeScript path configurations for compile-time
   - Declaration files for type support

## Future Improvements

We plan to improve the path alias system with the following steps:

1. **Custom ESM Loader**: Implement a custom ESM loader that resolves path aliases during module loading.
2. **Unified Testing Setup**: Create a consistent approach for all test files to use path aliases.
3. **Build System Updates**: Ensure the build system correctly processes path aliases in all contexts.

## Temporary Solution

In the meantime, to maintain consistency across the codebase:

1. **Main Source Files**: Use path aliases with `.js` extension:
   ```typescript
   import { Tool } from '@types/tool.js';
   ```

2. **Test Files**: Use relative paths with `.js` extension and add a comment:
   ```typescript
   // Note: Using relative paths while path alias system is being fully implemented
   import { utils } from '../../../tests/utils/test-utils.js';
   ```

3. **Type Declarations**: Create appropriate declaration files to provide type support:
   ```typescript
   // src/types/test-utils.d.ts
   declare module '@tests/utils/test-utils.js' {
     export function startMockServer(): Promise<any>;
     // ...
   }
   ```

## Final Goal

Our goal is to have consistent imports across all files:

```typescript
// In any file (source or test):
import { Tool } from '@types/tool.js';
import { startMockServer } from '@tests/utils/test-utils.js';
```

With full TypeScript support and no need for workarounds or special handling.