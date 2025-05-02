# Testing Chrome Control

This document outlines the comprehensive testing approach used in Chrome Control to ensure all MCP tools function correctly and can be reliably used by LLMs for browser automation.

## TypeScript and Testing

Chrome Control uses TypeScript for all code, including test files. Tests are written using Mocha and assertions are done using Node's built-in `assert` module.

### Explicit Mocha Imports

All test files should explicitly import Mocha functions:

```typescript
import { describe, it, before, after } from 'mocha';
import assert from 'assert';
```

### Module Imports

The project uses relative imports for module references:

```typescript
// Use relative imports like this:
import { foo } from '../../../utils/some-util.js';
```

In TypeScript files, always include the `.js` extension in imports even though the actual file has a `.ts` extension. This is required for ESM compatibility.

### VSCode Setup for Test Files

When using VSCode to work on test files, you might encounter issues with TypeScript not recognizing Mocha's global functions like `describe()` or `it()`. To fix these issues:

1. We've provided type definitions in `src/types/test-globals.d.ts` 
2. Configure VSCode with proper TypeScript settings:
   - Open `.vscode/settings.json` (created for you)
   - Ensure it contains:
     ```json
     {
       "javascript.validate.enable": true,
       "typescript.validate.enable": true,
       "typescript.tsdk": "node_modules/typescript/lib"
     }
     ```
3. If you're still having issues, reload VSCode window (Ctrl+Shift+P > "Developer: Reload Window")

### Running TypeScript Tests Directly

You can run the TypeScript tests directly without compiling them first:

```bash
npm run test:tools
```

This uses the Mocha configuration in `.mocharc.json` which:
- Uses ts-node to compile TypeScript on the fly
- Registers module aliases for path imports
- Sets experimental-specifier-resolution to node for easier imports
- Sets a timeout of 10 seconds for tests

### Type Checking Tests

To verify TypeScript types in test files:

```bash
npm run typecheck:test
```

### Checking All Code

To run both linting and type checking:

```bash
npm run check
```

## Testing Philosophy

Chrome Control uses a multi-layered testing approach to ensure high quality and reliability:

1. **Visual Verification** - All tests use non-headless browsers to allow visual inspection of automation actions
2. **Comprehensive Coverage** - Every MCP tool is tested with real-world scenarios
3. **Validation at Multiple Levels** - From low-level unit tests to end-to-end integration tests
4. **Automated Pre-commit Checks** - Tests must pass before code can be committed
5. **Schema Validation Tests** - Ensure MCP tool parameters are properly validated

## Test Types

### 1. LLM Simulation Tests

These tests simulate exactly how an LLM would interact with Chrome Control via STDIO and JSON-RPC, providing the most realistic test scenario:

```bash
npm run test:llm-simulation
```

Key characteristics:
- Uses the real STDIO interface that LLMs use
- Sends proper JSON-RPC requests following MCP protocol
- Reuses a single browser for efficiency
- Includes timeouts to prevent test hangs
- Creates screenshots for visual validation
- Tests core functionality an LLM would use

### 2. Full Feature Tests

These tests verify all Chrome Control MCP tools with visual browser interaction, providing comprehensive coverage of the entire feature set.

```bash
npm run test:full-features
```

Key characteristics:
- Tests every MCP tool with realistic user scenarios
- Uses visible browsers for visual verification
- Creates screenshots for visual validation
- Includes complex interactions like form filling, keyboard input, and cookie management

### 3. Comprehensive Tests

These tests focus on the core browser management and navigation functionality with visual verification.

```bash
npm run test:comprehensive
```

Key characteristics:
- Verifies browser and tab management
- Tests basic navigation and interaction
- Uses visible browsers
- Provides a faster subset of full feature tests

### 4. MCP Protocol Tests

These tests validate the integration with the Model Context Protocol (MCP) server interface.

```bash
npm run test:mcp
```

Key characteristics:
- Tests the actual JSON-RPC protocol interface
- Verifies correct MCP request and response formats
- Ensures proper tool registration and discovery

### 5. Schema Validation Tests

These tests ensure that Zod schemas are correctly converted to JSON Schema for MCP tools.

```bash
npm run test:zod
```

Key characteristics:
- Tests schema conversion edge cases
- Verifies handling of null/undefined schemas
- Tests circular references and complex schema structures

### 6. Unit Tests

These tests verify individual components and tools in isolation.

```bash
npm run test:unit
```

Key characteristics:
- Tests browser management functionality
- Tests tab management functionality
- Tests navigation and waiting functionality

## Screenshot Verification

All visual tests save screenshots to temporary directories for manual verification. These are organized by test category:

- `browser` - Browser management tests
- `tabs` - Tab management tests
- `navigation` - Navigation tests
- `interaction` - User interaction tests (click, hover, etc.)
- `forms` - Form filling tests
- `cookies` - Cookie management tests
- `evaluation` - JavaScript evaluation tests
- `chaining` - Action chaining tests

For more details on how temporary directories are used for test artifacts, see [Testing with Temporary Directories](./testing-with-temp-dirs.md).

## Automated Testing with Pre-commit Hooks

Chrome Control requires tests to pass before code can be committed. This is enforced through pre-commit hooks:

```bash
npm run precommit
```

This runs:
1. TypeScript compilation (`npm run build`)
2. All tests (`npm run test:all`)

## Running All Tests

To run the complete test suite:

```bash
npm run test:all
```

This will:
1. Run Zod schema validation tests (fast and reliable)
2. Run LLM simulation tests (complete end-to-end through STDIO interface)

These tests provide the best balance of speed, reliability, and coverage while using a single browser window to avoid redundant tabs and windows.

## Continuous Integration

In a CI/CD environment, the tests can be run with the headless flag set to true for non-visual testing. However, for development, we use non-headless browsers to allow visual verification of the automation process.

## Adding New Tests

When adding new features to Chrome Control:

1. Add unit tests for the new functionality using the `.__TEST__.ts` pattern next to implementation files
2. Add visual verification tests in `mcp-full-feature-test.js`
3. Update schema tests if new tool parameters are added
4. Ensure all tests pass before committing changes

### Co-located Test Pattern

Unit tests are co-located with the implementation files they test, following this pattern:

```
src/tools/tool-name/
  ├── index.ts                 # Implementation
  └── toolFunction.__TEST__.ts # Test file
```

Example test file structure:

```typescript
import { describe, it, before, after } from 'mocha';
import { strict as assert } from 'assert';
import { myFunction } from './index';
import { 
  startMockServer, 
  stopMockServer,
  executeToolCall
} from '@tests/utils/test-utils';

describe('myFunction', () => {
  let server;
  
  before(async () => {
    // Run before all tests
    server = await startMockServer();
  });
  
  after(async () => {
    // Run after all tests
    await stopMockServer(server);
  });
  
  it('should do something useful', async () => {
    // Test case
    const result = await myFunction({ param1: 'value1' });
    
    // Assertions
    assert.ok(result.content, 'Response should include content');
    assert.ok(
      result.content[0].text.includes('Expected text'),
      'Response should include expected text'
    );
  });
});

## Test HTTP Server

The tests use a local HTTP server to host test pages. This server provides pages for testing various features:

- Main test page with click, hover, and keyboard interactions
- Forms test page with various input types
- Cookies test page for cookie management
- Dynamic content page for testing waiting and asynchronous content

## Testing Philosophy for LLM Integration

Since Chrome Control is designed for use by Large Language Models (LLMs), our testing approach focuses on ensuring that:

1. All tools work as expected in typical LLM usage scenarios
2. Responses are structured appropriately for LLM consumption
3. Tools handle edge cases and errors gracefully
4. Visual verification allows human review of automation behavior

By maintaining this comprehensive testing approach, we ensure that Chrome Control remains a reliable and robust solution for browser automation with LLMs.