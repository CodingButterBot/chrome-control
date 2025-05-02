# Chrome Control Tools

This directory contains all the tools provided by Chrome Control, organized in a modular, category-based structure to make the codebase more maintainable, testable, and easier to extend.

## Directory Structure

The tools are organized into logical categories, with each category containing:
- Individual tool implementation directories
- A `__tests__` directory with tests for all tools in that category

```
tools/
├── browser/                   # Browser management tools
│   ├── create/                # Create browser implementation
│   ├── list/                  # List browsers implementation
│   ├── close/                 # Close browser implementation
│   ├── connect/               # Connect to existing browser implementation
│   ├── profile/               # Launch with user profile implementation
│   ├── detect/                # Detect existing browsers implementation
│   ├── profiles/              # List user profiles implementation
│   ├── __tests__/             # Tests for all browser tools
│   │   ├── create.test.js     # Tests for browser creation
│   │   ├── list.test.js       # Tests for browser listing
│   │   ├── close.test.js      # Tests for browser closing
│   │   └── ...
│   └── index.ts               # Exports all browser tools
├── tab/                       # Tab management tools
│   ├── create/                # Create tab implementation
│   ├── list/                  # List tabs implementation
│   ├── close/                 # Close tab implementation
│   ├── __tests__/             # Tests for all tab tools
│   └── index.ts               # Exports all tab tools
└── ... other categories
```

## Categories

The tools are divided into these main categories:

1. **Browser**: Tools for managing browser instances
2. **Tab**: Tools for managing browser tabs
3. **Navigation**: Tools for navigating to URLs and waiting for events
4. **Screenshot**: Tools for capturing visual information
5. **Mouse**: Tools for mouse interactions (click, hover, etc.)
6. **Keyboard**: Tools for keyboard input
7. **Form**: Tools for form interactions (filling, selecting)
8. **Cookie**: Tools for cookie management
9. **Script**: Tools for JavaScript evaluation
10. **Chain**: Tools for action chaining

## Tool Implementation

Each tool follows a consistent implementation pattern:

```typescript
// File: src/tools/category/toolname/index.ts

import { createTool } from '../../../mcp-server.js';
import { ParamType, ResponseType } from '../../../types/puppeteer.js';
import { paramSchema } from '../../../register.js';

// Implementation function
export async function toolFunction(params): Promise<ResponseType> {
  // Tool implementation
}

// Create and export the tool
export const toolNameTool = createTool(
  'chrome_tool_name',
  paramSchema,
  async (params) => toolFunction(params),
  { description: 'Tool description' }
);
```

## Testing

Tests are organized by category in the `__tests__` directory. Each test file focuses on one tool and can include multiple test cases with different parameters and edge cases.

```javascript
// File: src/tools/category/__tests__/toolname.test.js

describe('Tool Name', () => {
  // Setup and teardown

  it('should perform basic functionality', async () => {
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

1. Identify the appropriate category (or create a new one if needed)
2. Create a directory for your tool in that category
3. Implement the tool in an `index.ts` file
4. Add tests in the category's `__tests__` directory
5. Update the category's `index.ts` to export your tool
6. Update your test to thoroughly test your tool's functionality

## Test Cleanup

All tests should clean up after themselves to avoid leaving resources behind:

- Close any browser instances they create
- Delete any screenshots or other files they generate
- Reset any state they modify

This ensures tests don't interfere with each other and keeps the test environment clean.

## Running Tests

To run tests for a specific category:

```bash
# Run all tests for a category
npx jest src/tools/browser/__tests__

# Run tests for a specific tool
npx jest src/tools/browser/__tests__/create.test.js
```

Test files should be named clearly to indicate which tool they test, making it easy to find and run specific tests.