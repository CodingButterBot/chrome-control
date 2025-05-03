# TypeScript Test Solutions

This document outlines solutions to TypeScript testing challenges in the Chrome Control project, particularly with regard to ES modules and import paths.

## Problem Overview

The Chrome Control project encountered issues when trying to run TypeScript tests directly with the following specific challenges:

1. ES Module import paths with `.js` extensions not being properly resolved in TypeScript tests
2. Module resolution strategy conflicts between NodeNext (used in the main source) and Node (needed for tests)
3. Import cycles and missing files during test execution
4. Module not found errors when importing from compiled code

## Solutions

### 1. Direct Import from Built Files

For the most reliable testing approach, we build the project first and then test against the compiled JavaScript files. This approach works because:

- It tests the actual code that will be deployed to production
- It avoids TypeScript module resolution issues by using the built JavaScript files
- It's consistent with the runtime environment where only JavaScript is executed

**Implementation steps:**

1. Build the project with `npm run build`
2. Import from the compiled output in the `bin/` directory
3. Use dynamic imports with absolute paths to ensure correct resolution

Example script for direct imports:

```javascript
#!/usr/bin/env node
import { spawn, execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, unlinkSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

// Build first
execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

// Create a test runner that imports the compiled module
const testRunnerCode = `
import { strict as assert } from 'assert';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the compiled module with an absolute path
const { detectExistingBrowsers } = await import(join(__dirname, 'bin/tools/browser-detect/index.js'));

async function runTest() {
  try {
    // Test code here
    const result = await detectExistingBrowsers();
    assert.ok(result.content, 'Response should include content information');
    return 0;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return 1;
  }
}

runTest().then(code => process.exit(code));
`;

// Execute the test
const testRunnerPath = join(rootDir, 'temp-test-runner.js');
writeFileSync(testRunnerPath, testRunnerCode);
const testProcess = spawn('node', [testRunnerPath], { stdio: 'inherit', cwd: rootDir });
```

### 2. Enhanced TypeScript Test Runner Configuration

For direct TypeScript testing (without compilation), use these enhanced configurations:

**Temporary TypeScript Configuration:**

```json
{
  "extends": "./tsconfig.test.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "noImplicitAny": false,
    "paths": {
      "*": ["*", "*.js", "*.ts"]
    }
  },
  "ts-node": {
    "transpileOnly": true,
    "compilerOptions": {
      "module": "CommonJS"
    }
  }
}
```

**Required Environment Variables:**

```javascript
TS_NODE_PROJECT: tempTsConfig,
NODE_PATH: join(rootDir, 'node_modules') + ':' + join(rootDir, 'src'),
TS_NODE_TRANSPILE_ONLY: 'true',
TS_NODE_PREFER_TS_EXTS: 'true',
TS_NODE_IGNORE_DIAGNOSTICS: '2307,2691,2451,18003',
```

**Required Additional Packages:**

```bash
npm install --save-dev tsconfig-paths ts-node
```

### 3. TypeScript Compatibility Issues

Certain versions of TypeScript may have compatibility issues with other tools in the ecosystem. For example:

- TypeScript 5.4+ may not be fully compatible with eslint plugins
- Older ts-node versions may not work with newer TypeScript
- Module resolution settings may conflict between testing and build environments

The recommended solution is to:

1. Use TypeScript 5.3.x for maximum compatibility
2. Add explicit type assertions in test files where needed
3. Handle global variables by declaring them at the module level
4. Use the `as` keyword for type casting uncertain values

## Best Practices For TypeScript Tests

1. **Build before testing**: For most reliable results, build the project before running tests
2. **Use dynamic imports**: When testing built code, use dynamic imports with absolute paths
3. **Consistent module system**: Pick either ESM or CommonJS for tests and stick with it
4. **Always include .js extensions**: In import statements for proper ESM resolution
5. **Use temporary config**: Create a temporary TypeScript config for tests to avoid conflicts
6. **Handle global dependencies**: Use setup/teardown functions to manage global resources like browsers
7. **Runtime error handling**: Catch and display runtime errors with stack traces during tests

## Future Improvements

- Implement a standardized test runner that handles all these complexities automatically
- Consider moving to a different test framework that better supports TypeScript and ESM
- Add a pre-commit hook to ensure tests pass before allowing commits
- Add CI/CD integration to run tests on every pull request