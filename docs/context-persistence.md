# Context Persistence in Chrome Control

This document explains how browser and tab context persistence works in Chrome Control.

## Overview

All Chrome Control tools now return consistent browser and tab information in their responses. This ensures that subsequent calls can reference the correct resources without requiring the user to manually track and pass browser and tab IDs.

## Response Format

Every Chrome Control tool now returns a response in the following format:

```json
{
  "context": {
    "browserId": "uuid-of-browser",
    "browser": {
      "id": "uuid-of-browser",
      "pagesCount": 2,
      "createdAt": "2023-05-18T15:30:00.000Z",
      "lastUsed": "2023-05-18T15:35:00.000Z"
    },
    "tabId": "uuid-of-tab",
    "tab": {
      "id": "uuid-of-tab",
      "url": "https://example.com",
      "title": "Example Domain"
    }
  },
  "content": [
    { "type": "text", "text": "Tool-specific result message" },
    // Additional content items...
  ]
}
```

## Key Features

1. **Consistent Response Structure**: Every tool returns the same structure, making it easy to access browser and tab information.

2. **Context Persistence**: Tools preserve context between calls, making it easier to chain operations:
   - Create a browser, get its ID
   - Create a tab in that browser, get its ID
   - Navigate using those IDs
   - Take screenshots, interact with the page, etc.

3. **Automatic Tracking**: When operations result in new browsers or tabs, the context is updated accordingly.

4. **Chain Support**: The `chrome_chain` tool propagates context through multiple operations and returns the final context.

## Usage Examples

### Basic Usage Pattern

```javascript
// Create a browser and get its ID from the context
const createBrowserResult = await request('chrome_create_browser');
const browserId = createBrowserResult.context.browserId;

// Create a tab and get its ID from the context
const createTabResult = await request('chrome_create_tab', { browserId });
const tabId = createTabResult.context.tabId;

// Navigate to a URL using the IDs from previous results
const navigateResult = await request('chrome_navigate', {
  browserId,
  tabId,
  url: 'https://example.com'
});

// The context continues to be available
console.log(navigateResult.context.browserId); // Same as original browserId
console.log(navigateResult.context.tabId);     // Same as original tabId
```

### Auto-Context Within Action Chains

The `chrome_chain` tool automatically passes context between actions:

```javascript
const chainResult = await request('chrome_chain', {
  browserId, // Initial browser ID
  tabId,     // Initial tab ID
  actions: [
    {
      type: 'navigate',
      params: { url: 'https://example.com' }
      // No need to specify browserId/tabId here, they're inherited
    },
    {
      type: 'screenshot',
      params: { name: 'example' }
      // Again, no need to specify IDs
    }
  ]
});

// Final context after all chain operations
console.log(chainResult.context);
```

## Testing

You can run the context persistence tests using:

```bash
npm run test:context-persistence
```

This test verifies that:
1. Browser context is preserved across operations
2. Tab context is preserved across operations
3. Chain actions properly pass context between steps
4. Context is still provided even after closing resources

## Implementation Details

- Context information is collected at the beginning of each tool operation
- For operations that change state (like closing tabs), context is captured before the change
- Helper functions `getContextInfo()` and `createResponse()` ensure consistent formatting
- Chain operations track and update context between steps