# Test Cleanup Plan

This document outlines the plan for cleaning up and organizing the Chrome Control test suite to make it more maintainable, consistent, and efficient.

## Current State

The project currently has several types of tests in different locations:

1. **Co-located tests** in `src/tools/**/*.__TEST__.ts`
2. **Unit tests** in both `tests/unit/` and `tests/units/` directories (redundant)
3. **Integration tests** in the root of the `tests/` directory
4. **Screenshot test artifacts** stored in the project directory

## Target State

The target test structure will:

1. Keep **co-located unit tests** with the code they test in `src/tools/**/*.__TEST__.ts`
2. Consolidate the redundant `unit` and `units` directories into a single organized test directory
3. Use **temporary directories** for test artifacts instead of storing them in the project
4. Have a clear and consistent pattern for running tests

## Cleanup Steps

### Phase 1: Temporary Directories (Completed)

- ✅ Create utility functions for temporary directory management in `src/utils/test-utils.ts`:
  - `createTempTestDirectory(testName: string): string`
  - `cleanupTempDirectory(tempDir: string, patterns: string[] = ['*.png']): void`
- ✅ Update all tool tests to use temporary directories
- ✅ Update all legacy tests to use temporary directories
- ✅ Document the new approach in `docs/testing-with-temp-dirs.md` 
- ✅ Update testing documentation to reference temporary directories

### Phase 2: Eliminate Test Redundancy

1. Analyze the tests in both `unit` and `units` directories
2. Create a new consolidated test structure that maintains all functionality
3. Create new test runner scripts with category-based execution
4. Update package.json scripts to match the new structure

### Phase 3: Improve Test Consistency

1. Ensure all tests use the same import patterns
2. Standardize test setups and teardowns
3. Add clear documentation for each test suite
4. Create test helper functions for common tasks

### Phase 4: Test Coverage Improvements

1. Identify any gaps in test coverage
2. Add tests for edge cases and error conditions
3. Create comprehensive test cases for complex features
4. Add visual verification tests with screenshots

## Updated package.json Scripts

```json
{
  "scripts": {
    "test:all": "npm run test:tools && npm run test:integration",
    "test:tools": "mocha src/tools/**/*.__TEST__.ts",
    "test:integration": "mocha tests/integration/**/*.test.js",
    "test:category": "node scripts/run-category-tests.js"
  }
}
```

## Benefits

1. **Reduced Redundancy**: Eliminates duplicate test files and patterns
2. **Improved Organization**: Clear structure for different test types
3. **Better Performance**: No screenshot artifacts to track in git
4. **Easier Maintenance**: Tests are with the code they test
5. **Cleaner Repository**: Test artifacts not stored in the project

## Directory Pattern

The consolidated test structure should group tests by category:

```
tests/
├── integration/             # Integration tests
│   ├── browser/             # Browser integration tests
│   │   ├── creation.test.js # Browser creation tests
│   │   └── profile.test.js  # Browser profile tests
│   ├── navigation/          # Navigation integration tests
│   └── interaction/         # User interaction tests
└── utils/                   # Test utilities
    ├── test-server.js       # Test HTTP server
    ├── test-utils.js        # Common test utilities
    └── mock-server.js       # Mock MCP server for testing
```

Each test file should follow a consistent pattern with proper imports, setup/teardown, and clear test descriptions.