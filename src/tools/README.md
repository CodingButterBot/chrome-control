# Chrome Control Tools

This directory contains all the tools provided by Chrome Control, organized in a flat, focused structure where each tool has its own dedicated directory with implementations and tests.

## Directory Structure

The tools are organized in a flat structure, with each tool having its own dedicated directory:

```
tools/
├── browser-create/              # Create browser tool 
│   ├── index.ts                 # Tool implementation
│   ├── createBrowser.__TEST__.ts       # Test for basic functionality
│   └── createBrowserWithOptions.__TEST__.ts  # Test with various options
├── browser-list/                # List browsers tool
│   ├── index.ts                 
│   └── listBrowsers.__TEST__.ts
├── navigation-navigate/         # Navigate tool
│   ├── index.ts
│   ├── navigate.__TEST__.ts     
│   └── validateResponseFormat.__TEST__.ts
├── screenshot/                  # Screenshot tool
│   ├── index.ts
│   ├── fullPageScreenshot.__TEST__.ts
│   └── elementScreenshot.__TEST__.ts
└── ... (other tool directories)
```

## Key Benefits

This structure provides several benefits:

1. **Focused Organization**: Each tool has a dedicated directory containing all related code and tests.
2. **Clear Ownership**: It's clear which files belong to which tool.
3. **Scalability**: Easy to add new tools without modifying existing code.
4. **Discover-ability**: Easy to find a specific tool's implementation and tests.
5. **Isolation**: Changes to one tool don't affect others.
6. **Test Co-location**: Tests are right next to the code they test.

## Tool Implementation Pattern

Each tool follows a consistent implementation pattern:

```typescript
// File: src/tools/tool-name/index.ts

import { createTool } from '../../mcp-server.js';
import { ParamsType, ResponseType } from '../../types/puppeteer.js';
import { paramsSchema } from '../../register.js';

// Primary tool function
export async function toolFunction(params): Promise<ResponseType> {
  // Implementation
}

// Optional specialized helper functions
export async function specializedFunction1(...): Promise<ResponseType> {
  // Specialized implementation
}

export async function specializedFunction2(...): Promise<ResponseType> {
  // Specialized implementation
}

// Utility functions
export function helperFunction(...) {
  // Helper implementation
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

Tests are placed directly alongside the implementation file, with one test file per function:

```javascript
// File: src/tools/tool-name/functionName.__TEST__.ts

const assert = require('assert');
const { functionName } = require('./index');

describe('functionName', () => {
  // Setup and teardown
  
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
npx jest src/tools/browser-create

# Run a specific test
npx jest src/tools/browser-create/createBrowser.__TEST__.ts
```