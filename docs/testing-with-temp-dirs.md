# Testing with Temporary Directories

This document explains how Chrome Control tests use temporary directories for storing test artifacts like screenshots, which improves development experience and follows best practices.

## Temporary Test Directories

Instead of storing test artifacts in the project's source code, Chrome Control uses the operating system's temporary directory (`os.tmpdir()`) for test screenshots and other artifacts:

```typescript
// Utility function to create temporary test directories
function createTempTestDirectory(testName: string): string {
  const tempDir = path.join(os.tmpdir(), 'chrome-control-tests', testName);
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return tempDir;
}
```

## Key Benefits

1. **Clean Repository**: Test artifacts don't pollute the source code repository
2. **Improved CI/CD**: No need to handle test artifacts in CI/CD pipelines
3. **Automatic Cleanup**: Operating systems periodically clean up temporary directories
4. **Parallel Testing**: Tests can run in parallel without directory conflicts
5. **Faster Test Execution**: No need to commit or track test artifacts

## Using Temporary Directories in Tests

Here's how test files use temporary directories:

```typescript
import { createTempTestDirectory, cleanupTempDirectory } from '../../utils/test-utils.js';

// Create a temporary directory for test artifacts
const TEST_SCREENSHOT_DIR = createTempTestDirectory('my-test-name');

describe('My Test Suite', () => {
  // ...test implementation...
  
  after(async () => {
    // Clean up test artifacts
    cleanupTempDirectory(TEST_SCREENSHOT_DIR, ['*.png']);
  });
});
```

## Cleanup Utility

The `cleanupTempDirectory` function makes it easy to delete test artifacts after tests complete:

```typescript
/**
 * Cleans up temporary test directories
 * 
 * @param {string} tempDir Path to the temporary directory
 * @param {string[]} patterns File patterns to delete (default: ['*.png'])
 */
function cleanupTempDirectory(tempDir: string, patterns: string[] = ['*.png']): void {
  if (!fs.existsSync(tempDir)) return;
  
  const files = fs.readdirSync(tempDir);
  
  for (const file of files) {
    // Simple pattern matching
    if (patterns.some(pattern => {
      const regex = new RegExp(
        pattern.replace('.', '\\.').replace('*', '.*')
      );
      return regex.test(file);
    })) {
      fs.unlinkSync(path.join(tempDir, file));
    }
  }
}
```

## Viewing Test Screenshots

Test screenshots are stored in the system temporary directory and the path is logged to the console during test execution. To view these screenshots:

1. Run the test
2. Look for the console output showing the temporary directory path
3. Open the directory in your file explorer

Alternatively, you can run the following command to open the temporary directory:

```bash
# Open the Chrome Control test screenshots directory
open $(node -e "console.log(require('os').tmpdir() + '/chrome-control-tests')")
```

## Test Organization

Test artifacts are organized by test name:

```
/tmp/chrome-control-tests/
├── browser/                # Browser management test artifacts
├── tabs/                   # Tab management test artifacts  
├── navigation/             # Navigation test artifacts
├── interaction/            # Interaction test artifacts
├── forms/                  # Form interaction test artifacts
├── cookies/                # Cookie management test artifacts
├── evaluation/             # JavaScript evaluation test artifacts
└── chaining/               # Action chaining test artifacts
```

## Implementation Details

The temporary directory utilities are implemented in `src/utils/test-utils.ts` and imported by test files. The implementation ensures:

1. Directory creation if it doesn't exist
2. Proper cleanup after tests complete
3. Organized structure by test name
4. Cross-platform compatibility (works on Windows, macOS, and Linux)

## Migrating from test-screenshots

The project previously used a `test-screenshots` directory in the source tree. All tests have been updated to use temporary directories instead. If you're updating an older test, make sure to:

1. Import the utility functions: `import { createTempTestDirectory, cleanupTempDirectory } from '../../utils/test-utils.js';`
2. Replace directory creation: `const TEST_SCREENSHOT_DIR = createTempTestDirectory('your-test-name');`
3. Replace cleanup code: `cleanupTempDirectory(TEST_SCREENSHOT_DIR, ['*.png']);`
4. Remove any references to the old `test-screenshots` directory