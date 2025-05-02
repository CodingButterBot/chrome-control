# Chrome Control Tools

This directory contains all the tools provided by Chrome Control, organized in a flat, focused structure where each tool has its own dedicated directory with implementations and tests.

## Directory Structure

The tools are organized in a flat structure, with each tool having its own dedicated directory:

```
tools/
├── browser-close/              # Close browser tool
│   ├── index.ts                # Tool implementation
│   └── closeBrowser.__TEST__.ts       # Test for functionality
├── browser-connect/            # Connect to existing browser tool
│   ├── index.ts
│   └── connectToExistingBrowser.__TEST__.ts
├── browser-create/             # Create browser tool 
│   ├── index.ts
│   ├── createBrowser.__TEST__.ts
│   └── createBrowserWithOptions.__TEST__.ts
├── browser-detect/             # Detect existing browsers tool
│   ├── index.ts
│   └── detectExistingBrowsers.__TEST__.ts
├── browser-list/               # List browsers tool
│   ├── index.ts
│   └── listBrowsers.__TEST__.ts
├── browser-profile/            # Launch with profile tool
│   ├── index.ts
│   └── launchWithUserProfile.__TEST__.ts
├── browser-profiles/           # List profiles tool
│   ├── index.ts
│   └── listUserProfiles.__TEST__.ts
├── chain-actions/              # Action chaining tool
│   ├── index.ts
│   └── chainActions.__TEST__.ts
├── cookie-manage/              # Cookie management tool
│   ├── index.ts
│   └── manageCookies.__TEST__.ts
├── form-fill/                  # Fill form fields tool
│   ├── index.ts
│   └── fill.__TEST__.ts
├── form-select/                # Select dropdown options tool
│   ├── index.ts
│   └── select.__TEST__.ts
├── form-submit/                # Submit forms tool
│   ├── index.ts
│   └── submitForm.__TEST__.ts
├── keyboard/                   # Keyboard actions tool
│   ├── index.ts
│   └── controlKeyboard.__TEST__.ts
├── keyboard-type/              # Keyboard typing tool
│   ├── index.ts
│   └── controlKeyboardType.__TEST__.ts
├── mouse-click/                # Mouse click tool
│   ├── index.ts
│   └── clickElement.__TEST__.ts
├── mouse-control/              # Mouse position control tool
│   ├── index.ts
│   └── controlMouse.__TEST__.ts
├── mouse-hover/                # Mouse hover tool
│   ├── index.ts
│   └── hover.__TEST__.ts
├── navigation-navigate/        # Navigate tool
│   ├── index.ts
│   └── navigate.__TEST__.ts
├── navigation-wait/            # Wait for conditions tool
│   ├── index.ts
│   └── wait.__TEST__.ts
├── screenshot/                 # Screenshot tool
│   ├── index.ts
│   └── screenshot.__TEST__.ts
├── script-evaluate/            # JavaScript evaluation tool
│   ├── index.ts
│   └── evaluate.__TEST__.ts
├── script-execute/             # Script execution tool
│   ├── index.ts
│   └── executeScript.__TEST__.ts
├── tab-close/                  # Close tab tool
│   ├── index.ts
│   └── closeTab.__TEST__.ts
├── tab-create/                 # Create tab tool
│   ├── index.ts
│   └── createTab.__TEST__.ts
└── tab-list/                   # List tabs tool
    ├── index.ts
    └── listTabs.__TEST__.ts
```

## Key Benefits

This structure provides several benefits:

1. **Focused Organization**: Each tool has a dedicated directory containing all related code and tests.
2. **Clear Ownership**: It's clear which files belong to which tool.
3. **Scalability**: Easy to add new tools without modifying existing code.
4. **Discover-ability**: Easy to find a specific tool's implementation and tests.
5. **Isolation**: Changes to one tool don't affect others.
6. **Test Co-location**: Tests are right next to the code they test.

## Tool Categories

The tools are organized into these categories:

### Browser Management
- `browser-create`: Create new browser instances
- `browser-list`: List running browser instances
- `browser-close`: Close browser instances
- `browser-connect`: Connect to existing Chrome instances
- `browser-profile`: Launch Chrome with user profiles
- `browser-detect`: Detect existing Chrome instances
- `browser-profiles`: List available Chrome user profiles

### Tab Management
- `tab-create`: Create new tabs
- `tab-list`: List open tabs
- `tab-close`: Close tabs

### Navigation
- `navigation-navigate`: Navigate to URLs
- `navigation-wait`: Wait for elements, navigation, or time periods

### Interaction
- `mouse-click`: Click elements
- `mouse-hover`: Hover over elements
- `mouse-control`: Control mouse position and buttons
- `keyboard`: Control keyboard actions
- `keyboard-type`: Type text
- `form-fill`: Fill form fields
- `form-select`: Select dropdown options
- `form-submit`: Submit forms

### Data & State
- `screenshot`: Take screenshots
- `cookie-manage`: Manage browser cookies
- `script-evaluate`: Evaluate JavaScript in the browser
- `script-execute`: Execute JavaScript files
- `chain-actions`: Execute multiple actions in sequence

## Tool Implementation Pattern

Each tool follows a consistent implementation pattern:

```typescript
// File: src/tools/tool-name/index.ts

import { createTool } from '../../mcp-server.js';
import { ParamsType, ChromeToolResponse } from '../../types/puppeteer.js';
import { paramsSchema } from '../../register.js';

/**
 * Primary tool function with JSDoc comments
 * 
 * Detailed description of what the function does.
 * 
 * @param params - Parameter description
 * @returns Promise resolving to a response
 */
export async function toolFunction(params: ParamsType): Promise<ChromeToolResponse> {
  // Implementation or forwarding to puppeteer.js
  const { originalFunction } = await import('../../puppeteer.js');
  return await originalFunction(params);
}

// Create and export the tool
export const toolNameTool = createTool(
  'chrome_tool_name',
  paramsSchema,
  async (params) => toolFunction(params),
  { description: 'Tool description' }
);
```

## Test Pattern

Tests are placed directly alongside the implementation file, with one test file per function using ES module syntax:

```typescript
// File: src/tools/tool-name/functionName.__TEST__.ts

import { strict as assert } from 'assert';
import { functionName } from './index.js';
import path from 'path';
import fs from 'fs';

// Import the test utils
import { 
  startMockServer, 
  stopMockServer,
  executeToolCall,
  ensureDirectoryExists,
  createTestPage
} from '../../../tests/utils/test-utils.js';

describe('functionName', () => {
  let server;
  let browserId;
  let tabId;
  
  // Setup and teardown
  before(async () => {
    server = await startMockServer();
  });
  
  after(async () => {
    await stopMockServer(server);
  });
  
  // Tests
  it('should perform its basic functionality', async () => {
    // Test basic functionality
  });
  
  it('should handle specific parameters correctly', async () => {
    // Test with specific parameters
  });
  
  it('should handle error cases appropriately', async () => {
    // Test error handling
  });
});
```

## Adding New Tools

To add a new tool:

1. Create a new directory for your tool with a descriptive name (e.g., `browser-create`)
2. Create an `index.ts` file with your tool implementation
3. Create test files for each exported function with the `.__TEST__.ts` suffix
4. Update the main `tools/index.ts` file to import and export your tool
5. Run tests to ensure your tool works correctly

## Naming Conventions

- **Tool Directories**: Use a `category-action` format (e.g., `browser-create`, `navigation-navigate`)
- **Implementation File**: Always named `index.ts`
- **Test Files**: Named after the function they test with a `.__TEST__.ts` suffix
- **Tool Exports**: Use camelCase for functions, and add the word "Tool" to the tool export (e.g., `createBrowserTool`)

## Running Tests

To run tests for a specific tool:

```bash
# Run tests for a specific tool
npm test -- src/tools/browser-create

# Run a specific test
npm test -- src/tools/browser-create/createBrowser.__TEST__.ts

# Run all tests
npm test
```